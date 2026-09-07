from __future__ import annotations

from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.controllers import dns_record_controller
from app.core.database import get_db
from app.models.dns_record import DnsRecordType
from app.models.user import User
from app.schemas.dns_record import DnsRecordCreate, DnsRecordResponse, DnsRecordUpdate
from app.schemas.pagination import Page

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["dns-records"])


class BulkDeleteRequest(BaseModel):
    record_ids: list[int] = Field(min_length=1)


@router.get("", response_model=Page[DnsRecordResponse])
def list_records(
    zone_id: int,
    search: str | None = Query(default=None),
    type: DnsRecordType | None = Query(default=None),
    sort_by: str = Query(default="name"),
    sort_dir: str = Query(default="asc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Page[DnsRecordResponse]:
    return dns_record_controller.list_records(
        db, zone_id, search=search, record_type=type, sort_by=sort_by, sort_dir=sort_dir, page=page, page_size=page_size
    )


@router.post("", response_model=DnsRecordResponse, status_code=201)
def create_record(
    zone_id: int, payload: DnsRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> DnsRecordResponse:
    return dns_record_controller.create_record(db, zone_id, payload, current_user)


@router.post("/bulk-delete")
def bulk_delete_records(
    zone_id: int, payload: BulkDeleteRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> dict:
    deleted = dns_record_controller.bulk_delete_records(db, zone_id, payload.record_ids, current_user)
    return {"deleted": deleted}


@router.get("/{record_id}", response_model=DnsRecordResponse)
def get_record(
    zone_id: int, record_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)
) -> DnsRecordResponse:
    return dns_record_controller.get_record(db, zone_id, record_id)


@router.put("/{record_id}", response_model=DnsRecordResponse)
def update_record(
    zone_id: int,
    record_id: int,
    payload: DnsRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DnsRecordResponse:
    return dns_record_controller.update_record(db, zone_id, record_id, payload, current_user)


@router.delete("/{record_id}", status_code=204)
def delete_record(
    zone_id: int, record_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    dns_record_controller.delete_record(db, zone_id, record_id, current_user)
