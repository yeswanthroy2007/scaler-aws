from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.hosted_zone import HostedZone


class DnsRecordType(str, enum.Enum):
    A = "A"
    AAAA = "AAAA"
    CNAME = "CNAME"
    TXT = "TXT"
    MX = "MX"
    NS = "NS"
    PTR = "PTR"
    SRV = "SRV"
    CAA = "CAA"


class RoutingPolicy(str, enum.Enum):
    SIMPLE = "simple"
    WEIGHTED = "weighted"
    LATENCY = "latency"
    FAILOVER = "failover"
    GEOLOCATION = "geolocation"


class DnsRecord(Base):
    __tablename__ = "dns_records"
    __table_args__ = (Index("ix_dns_records_zone_name", "hosted_zone_id", "name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    hosted_zone_id: Mapped[int] = mapped_column(
        ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[DnsRecordType] = mapped_column(
        Enum(DnsRecordType, native_enum=False, length=8), nullable=False, index=True
    )
    ttl: Mapped[int] = mapped_column(Integer, nullable=False, default=300)
    value: Mapped[str] = mapped_column(Text, nullable=False)

    # Type-specific optional fields (MX priority, SRV priority/weight/port, CAA flags/tag)
    priority: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight: Mapped[int | None] = mapped_column(Integer, nullable=True)
    port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    flags: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tag: Mapped[str | None] = mapped_column(String(16), nullable=True)

    routing_policy: Mapped[RoutingPolicy] = mapped_column(
        Enum(RoutingPolicy, native_enum=False, length=16), nullable=False, default=RoutingPolicy.SIMPLE
    )
    set_identifier: Mapped[str | None] = mapped_column(String(128), nullable=True)

    is_alias: Mapped[bool] = mapped_column(default=False)
    health_check_status: Mapped[str] = mapped_column(String(16), nullable=False, default="none")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    hosted_zone: Mapped["HostedZone"] = relationship(back_populates="records")
