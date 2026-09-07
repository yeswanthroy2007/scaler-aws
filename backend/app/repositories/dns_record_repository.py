from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.dns_record import DnsRecord, DnsRecordType

_SORT_COLUMNS = {
    "name": DnsRecord.name,
    "type": DnsRecord.type,
    "ttl": DnsRecord.ttl,
    "created_at": DnsRecord.created_at,
}


class DnsRecordRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, record_id: int) -> DnsRecord | None:
        return self.db.get(DnsRecord, record_id)

    def find_duplicate(
        self, *, hosted_zone_id: int, name: str, type: DnsRecordType, exclude_id: int | None = None
    ) -> DnsRecord | None:
        stmt = select(DnsRecord).where(
            DnsRecord.hosted_zone_id == hosted_zone_id,
            DnsRecord.name == name,
            DnsRecord.type == type,
        )
        if exclude_id is not None:
            stmt = stmt.where(DnsRecord.id != exclude_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_paginated(
        self,
        *,
        hosted_zone_id: int,
        search: str | None,
        record_type: DnsRecordType | None,
        sort_by: str,
        sort_dir: str,
        page: int,
        page_size: int,
    ) -> tuple[list[DnsRecord], int]:
        stmt = select(DnsRecord).where(DnsRecord.hosted_zone_id == hosted_zone_id)
        count_stmt = select(func.count(DnsRecord.id)).where(DnsRecord.hosted_zone_id == hosted_zone_id)

        if search:
            like = f"%{search.strip().lower()}%"
            condition = or_(func.lower(DnsRecord.name).like(like), func.lower(DnsRecord.value).like(like))
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

        if record_type is not None:
            stmt = stmt.where(DnsRecord.type == record_type)
            count_stmt = count_stmt.where(DnsRecord.type == record_type)

        total = self.db.execute(count_stmt).scalar_one()

        sort_column = _SORT_COLUMNS.get(sort_by, DnsRecord.name)
        sort_column = sort_column.desc() if sort_dir == "desc" else sort_column.asc()
        stmt = stmt.order_by(sort_column).offset((page - 1) * page_size).limit(page_size)

        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def list_all_for_zone(self, hosted_zone_id: int) -> list[DnsRecord]:
        stmt = (
            select(DnsRecord)
            .where(DnsRecord.hosted_zone_id == hosted_zone_id)
            .order_by(DnsRecord.name.asc(), DnsRecord.type.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def count_for_zone(self, hosted_zone_id: int) -> int:
        stmt = select(func.count(DnsRecord.id)).where(DnsRecord.hosted_zone_id == hosted_zone_id)
        return self.db.execute(stmt).scalar_one()

    def count_all(self) -> int:
        return self.db.execute(select(func.count(DnsRecord.id))).scalar_one()

    def create(self, record: DnsRecord) -> DnsRecord:
        self.db.add(record)
        self.db.flush()
        return record

    def update(self, record: DnsRecord) -> DnsRecord:
        self.db.flush()
        return record

    def delete(self, record: DnsRecord) -> None:
        self.db.delete(record)
        self.db.flush()

    def delete_many(self, records: list[DnsRecord]) -> None:
        for record in records:
            self.db.delete(record)
        self.db.flush()

    def get_many_by_ids(self, hosted_zone_id: int, ids: list[int]) -> list[DnsRecord]:
        stmt = select(DnsRecord).where(DnsRecord.hosted_zone_id == hosted_zone_id, DnsRecord.id.in_(ids))
        return list(self.db.execute(stmt).scalars().all())
