from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.dns_record import DnsRecord, DnsRecordType
from app.repositories.dns_record_repository import DnsRecordRepository
from app.repositories.hosted_zone_repository import HostedZoneRepository
from app.schemas.dns_record import DnsRecordCreate, DnsRecordResponse, DnsRecordUpdate
from app.schemas.pagination import Page, build_page
from app.services.audit_service import AuditService

# Record types that must not be duplicated at the same name (RFC-ish rules, simplified for the console clone)
_SINGLETON_AT_NAME = {DnsRecordType.CNAME}


class DnsRecordService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = DnsRecordRepository(db)
        self.zones = HostedZoneRepository(db)
        self.audit = AuditService(db)

    def _ensure_zone_exists(self, hosted_zone_id: int) -> None:
        if self.zones.get_by_id(hosted_zone_id) is None:
            raise NotFoundError(f"Hosted zone {hosted_zone_id} was not found")

    def list_records(
        self,
        *,
        hosted_zone_id: int,
        search: str | None,
        record_type: DnsRecordType | None,
        sort_by: str,
        sort_dir: str,
        page: int,
        page_size: int,
    ) -> Page[DnsRecordResponse]:
        self._ensure_zone_exists(hosted_zone_id)
        records, total = self.repo.list_paginated(
            hosted_zone_id=hosted_zone_id,
            search=search,
            record_type=record_type,
            sort_by=sort_by,
            sort_dir=sort_dir,
            page=page,
            page_size=page_size,
        )
        items = [DnsRecordResponse.model_validate(r) for r in records]
        return build_page(items, total, page, page_size)

    def get_record(self, hosted_zone_id: int, record_id: int) -> DnsRecordResponse:
        record = self._get_record_or_raise(hosted_zone_id, record_id)
        return DnsRecordResponse.model_validate(record)

    def _get_record_or_raise(self, hosted_zone_id: int, record_id: int) -> DnsRecord:
        record = self.repo.get_by_id(record_id)
        if record is None or record.hosted_zone_id != hosted_zone_id:
            raise NotFoundError(f"Record {record_id} was not found in this hosted zone")
        return record

    def _check_duplicate(
        self, *, hosted_zone_id: int, payload: DnsRecordCreate | DnsRecordUpdate, exclude_id: int | None = None
    ) -> None:
        if payload.type in _SINGLETON_AT_NAME:
            existing = self.repo.find_duplicate(
                hosted_zone_id=hosted_zone_id, name=payload.name, type=payload.type, exclude_id=exclude_id
            )
            if existing is not None:
                raise ConflictError(f"A {payload.type.value} record already exists for this name")
        else:
            existing = self.repo.find_duplicate(
                hosted_zone_id=hosted_zone_id, name=payload.name, type=payload.type, exclude_id=exclude_id
            )
            if existing is not None and existing.value.strip().lower() == payload.value.strip().lower():
                raise ConflictError("An identical record already exists")

        cname_conflict = self.repo.find_duplicate(
            hosted_zone_id=hosted_zone_id, name=payload.name, type=DnsRecordType.CNAME, exclude_id=exclude_id
        )
        if cname_conflict is not None and payload.type != DnsRecordType.CNAME:
            raise ValidationError("This name already has a CNAME record; no other records can share that name")

    def create_record(self, hosted_zone_id: int, payload: DnsRecordCreate, *, user_id: int) -> DnsRecordResponse:
        self._ensure_zone_exists(hosted_zone_id)
        self._check_duplicate(hosted_zone_id=hosted_zone_id, payload=payload)

        record = DnsRecord(hosted_zone_id=hosted_zone_id, **payload.model_dump())
        record = self.repo.create(record)
        self.audit.record(
            user_id=user_id,
            action="create",
            resource_type="dns_record",
            resource_id=str(record.id),
            resource_label=f"{record.name or '@'} ({record.type.value})",
        )
        return DnsRecordResponse.model_validate(record)

    def update_record(
        self, hosted_zone_id: int, record_id: int, payload: DnsRecordUpdate, *, user_id: int
    ) -> DnsRecordResponse:
        record = self._get_record_or_raise(hosted_zone_id, record_id)
        self._check_duplicate(hosted_zone_id=hosted_zone_id, payload=payload, exclude_id=record_id)

        for field, value in payload.model_dump().items():
            setattr(record, field, value)

        record = self.repo.update(record)
        self.audit.record(
            user_id=user_id,
            action="update",
            resource_type="dns_record",
            resource_id=str(record.id),
            resource_label=f"{record.name or '@'} ({record.type.value})",
        )
        return DnsRecordResponse.model_validate(record)

    def delete_record(self, hosted_zone_id: int, record_id: int, *, user_id: int) -> None:
        record = self._get_record_or_raise(hosted_zone_id, record_id)
        label = f"{record.name or '@'} ({record.type.value})"
        self.repo.delete(record)
        self.audit.record(user_id=user_id, action="delete", resource_type="dns_record", resource_id=str(record_id), resource_label=label)

    def bulk_delete(self, hosted_zone_id: int, record_ids: list[int], *, user_id: int) -> int:
        self._ensure_zone_exists(hosted_zone_id)
        records = self.repo.get_many_by_ids(hosted_zone_id, record_ids)
        for record in records:
            self.audit.record(
                user_id=user_id,
                action="delete",
                resource_type="dns_record",
                resource_id=str(record.id),
                resource_label=f"{record.name or '@'} ({record.type.value})",
            )
        self.repo.delete_many(records)
        return len(records)
