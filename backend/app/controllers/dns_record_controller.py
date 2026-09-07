from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import ValidationError
from app.models.dns_record import DnsRecordType
from app.models.user import User
from app.schemas.dns_record import DnsRecordCreate, DnsRecordResponse, DnsRecordUpdate
from app.schemas.pagination import Page
from app.services.dns_record_service import DnsRecordService


def list_records(
    db: Session,
    hosted_zone_id: int,
    *,
    search: str | None,
    record_type: DnsRecordType | None,
    sort_by: str,
    sort_dir: str,
    page: int,
    page_size: int,
) -> Page[DnsRecordResponse]:
    return DnsRecordService(db).list_records(
        hosted_zone_id=hosted_zone_id,
        search=search,
        record_type=record_type,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )


def get_record(db: Session, hosted_zone_id: int, record_id: int) -> DnsRecordResponse:
    return DnsRecordService(db).get_record(hosted_zone_id, record_id)


def create_record(db: Session, hosted_zone_id: int, payload: DnsRecordCreate, current_user: User) -> DnsRecordResponse:
    result = DnsRecordService(db).create_record(hosted_zone_id, payload, user_id=current_user.id)
    db.commit()
    return result


def update_record(
    db: Session, hosted_zone_id: int, record_id: int, payload: DnsRecordUpdate, current_user: User
) -> DnsRecordResponse:
    result = DnsRecordService(db).update_record(hosted_zone_id, record_id, payload, user_id=current_user.id)
    db.commit()
    return result


def delete_record(db: Session, hosted_zone_id: int, record_id: int, current_user: User) -> None:
    DnsRecordService(db).delete_record(hosted_zone_id, record_id, user_id=current_user.id)
    db.commit()


def bulk_delete_records(db: Session, hosted_zone_id: int, record_ids: list[int], current_user: User) -> int:
    if not record_ids:
        raise ValidationError("No record IDs provided")
    count = DnsRecordService(db).bulk_delete(hosted_zone_id, record_ids, user_id=current_user.id)
    db.commit()
    return count
