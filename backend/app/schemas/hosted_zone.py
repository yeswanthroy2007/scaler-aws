from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.hosted_zone import HostedZoneType

_DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.?$"
)


def validate_domain_name(value: str) -> str:
    value = value.strip().lower().rstrip(".")
    if not value or not _DOMAIN_RE.match(value):
        raise ValueError("Enter a valid domain name, e.g. example.com")
    if "." not in value:
        raise ValueError("Domain name must contain at least one dot, e.g. example.com")
    return value


class HostedZoneCreate(BaseModel):
    domain_name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    zone_type: HostedZoneType = HostedZoneType.PUBLIC
    vpc_id: str | None = Field(default=None, max_length=64)
    vpc_region: str | None = Field(default=None, max_length=32)

    @field_validator("domain_name")
    @classmethod
    def _validate_domain(cls, value: str) -> str:
        return validate_domain_name(value)

    @model_validator(mode="after")
    def _validate_private_zone(self) -> "HostedZoneCreate":
        if self.zone_type == HostedZoneType.PRIVATE:
            if not self.vpc_id or not self.vpc_region:
                raise ValueError("Private hosted zones require a VPC ID and VPC region")
        return self


class HostedZoneUpdate(BaseModel):
    description: str | None = Field(default=None, max_length=1000)
    comment: str | None = Field(default=None, max_length=1000)


class HostedZoneResponse(BaseModel):
    id: int
    zone_id: str
    domain_name: str
    zone_type: HostedZoneType
    description: str | None
    comment: str | None
    vpc_id: str | None
    vpc_region: str | None
    name_servers: list[str]
    record_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_model(cls, zone, record_count: int) -> "HostedZoneResponse":
        return cls(
            id=zone.id,
            zone_id=zone.zone_id,
            domain_name=zone.domain_name,
            zone_type=zone.zone_type,
            description=zone.description,
            comment=zone.comment,
            vpc_id=zone.vpc_id,
            vpc_region=zone.vpc_region,
            name_servers=zone.name_server_list,
            record_count=record_count,
            created_at=zone.created_at,
            updated_at=zone.updated_at,
        )
