from __future__ import annotations

import ipaddress
import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.dns_record import DnsRecordType, RoutingPolicy

_HOSTNAME_LABEL_RE = re.compile(r"^(\*|[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?)$")

CAA_VALID_TAGS = {"issue", "issuewild", "iodef"}


def validate_record_name(value: str) -> str:
    value = value.strip().lower().rstrip(".")
    if value == "":
        return value  # apex record (root of the zone)
    for label in value.split("."):
        if not _HOSTNAME_LABEL_RE.match(label):
            raise ValueError(f"'{value}' is not a valid record name")
    return value


class DnsRecordBase(BaseModel):
    name: str = Field(default="", max_length=255)
    type: DnsRecordType
    ttl: int = Field(default=300, ge=0, le=2_147_483_647)
    value: str = Field(min_length=1, max_length=2000)
    priority: int | None = Field(default=None, ge=0, le=65535)
    weight: int | None = Field(default=None, ge=0, le=65535)
    port: int | None = Field(default=None, ge=0, le=65535)
    flags: int | None = Field(default=None, ge=0, le=255)
    tag: str | None = Field(default=None, max_length=16)
    routing_policy: RoutingPolicy = RoutingPolicy.SIMPLE
    set_identifier: str | None = Field(default=None, max_length=128)

    @field_validator("name")
    @classmethod
    def _validate_name(cls, value: str) -> str:
        return validate_record_name(value)

    @field_validator("value")
    @classmethod
    def _strip_value(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def _validate_by_type(self) -> "DnsRecordBase":
        record_type = self.type

        if record_type == DnsRecordType.A:
            try:
                ipaddress.IPv4Address(self.value)
            except ValueError as exc:
                raise ValueError("A record value must be a valid IPv4 address") from exc

        elif record_type == DnsRecordType.AAAA:
            try:
                ipaddress.IPv6Address(self.value)
            except ValueError as exc:
                raise ValueError("AAAA record value must be a valid IPv6 address") from exc

        elif record_type == DnsRecordType.MX:
            if self.priority is None:
                raise ValueError("MX records require a priority")
            if not self.value or "." not in self.value:
                raise ValueError("MX record value must be a valid mail server hostname")

        elif record_type == DnsRecordType.SRV:
            if self.priority is None or self.weight is None or self.port is None:
                raise ValueError("SRV records require priority, weight, and port")

        elif record_type == DnsRecordType.CAA:
            if self.flags is None:
                self.flags = 0
            if not self.tag or self.tag.lower() not in CAA_VALID_TAGS:
                raise ValueError(f"CAA record tag must be one of: {', '.join(sorted(CAA_VALID_TAGS))}")
            self.tag = self.tag.lower()

        elif record_type in (DnsRecordType.CNAME, DnsRecordType.NS, DnsRecordType.PTR):
            if not self.value:
                raise ValueError(f"{record_type.value} record requires a target value")

        elif record_type == DnsRecordType.TXT:
            if len(self.value) > 2000:
                raise ValueError("TXT record value is too long")

        if record_type == DnsRecordType.CNAME and self.name == "":
            raise ValueError("CNAME records cannot be created at the zone apex")

        return self


class DnsRecordCreate(DnsRecordBase):
    pass


class DnsRecordUpdate(DnsRecordBase):
    pass


class DnsRecordResponse(BaseModel):
    id: int
    hosted_zone_id: int
    name: str
    type: DnsRecordType
    ttl: int
    value: str
    priority: int | None
    weight: int | None
    port: int | None
    flags: int | None
    tag: str | None
    routing_policy: RoutingPolicy
    set_identifier: str | None
    health_check_status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
