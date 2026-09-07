from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.dns_record import DnsRecord


class HostedZoneType(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"


def _generate_zone_id() -> str:
    return "/hostedzone/" + uuid.uuid4().hex[:13].upper()


class HostedZone(Base):
    __tablename__ = "hosted_zones"
    __table_args__ = (Index("ix_hosted_zones_domain_name", "domain_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    zone_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=_generate_zone_id)
    domain_name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    zone_type: Mapped[HostedZoneType] = mapped_column(
        Enum(HostedZoneType, native_enum=False, length=16), default=HostedZoneType.PUBLIC, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    vpc_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    vpc_region: Mapped[str | None] = mapped_column(String(32), nullable=True)
    name_servers: Mapped[str] = mapped_column(Text, nullable=False, default="")
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    records: Mapped[list["DnsRecord"]] = relationship(
        back_populates="hosted_zone", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def record_count(self) -> int:
        return len(self.records)

    @property
    def name_server_list(self) -> list[str]:
        return [ns for ns in self.name_servers.split("\n") if ns]
