from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.dns_record import DnsRecord
from app.models.hosted_zone import HostedZone, HostedZoneType

_SORT_COLUMNS = {
    "domain_name": HostedZone.domain_name,
    "created_at": HostedZone.created_at,
    "updated_at": HostedZone.updated_at,
    "zone_type": HostedZone.zone_type,
}


class HostedZoneRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, zone_id: int) -> HostedZone | None:
        return self.db.get(HostedZone, zone_id)

    def get_by_domain(self, domain_name: str) -> HostedZone | None:
        stmt = select(HostedZone).where(HostedZone.domain_name == domain_name)
        return self.db.execute(stmt).scalar_one_or_none()

    def count_records(self, zone_id: int) -> int:
        stmt = select(func.count(DnsRecord.id)).where(DnsRecord.hosted_zone_id == zone_id)
        return self.db.execute(stmt).scalar_one()

    def list_paginated(
        self,
        *,
        search: str | None,
        zone_type: HostedZoneType | None,
        sort_by: str,
        sort_dir: str,
        page: int,
        page_size: int,
    ) -> tuple[list[HostedZone], int]:
        stmt = select(HostedZone)
        count_stmt = select(func.count(HostedZone.id))

        if search:
            like = f"%{search.strip().lower()}%"
            condition = or_(
                func.lower(HostedZone.domain_name).like(like),
                func.lower(HostedZone.description).like(like),
                func.lower(HostedZone.zone_id).like(like),
            )
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

        if zone_type is not None:
            stmt = stmt.where(HostedZone.zone_type == zone_type)
            count_stmt = count_stmt.where(HostedZone.zone_type == zone_type)

        total = self.db.execute(count_stmt).scalar_one()

        sort_column = _SORT_COLUMNS.get(sort_by, HostedZone.created_at)
        sort_column = sort_column.desc() if sort_dir == "desc" else sort_column.asc()
        stmt = stmt.order_by(sort_column).offset((page - 1) * page_size).limit(page_size)

        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def create(self, zone: HostedZone) -> HostedZone:
        self.db.add(zone)
        self.db.flush()
        return zone

    def update(self, zone: HostedZone) -> HostedZone:
        self.db.flush()
        return zone

    def delete(self, zone: HostedZone) -> None:
        self.db.delete(zone)
        self.db.flush()

    def count_by_type(self, zone_type: HostedZoneType) -> int:
        stmt = select(func.count(HostedZone.id)).where(HostedZone.zone_type == zone_type)
        return self.db.execute(stmt).scalar_one()

    def count_all(self) -> int:
        return self.db.execute(select(func.count(HostedZone.id))).scalar_one()
