from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.controllers import hosted_zone_controller
from app.core.database import get_db
from app.models.hosted_zone import HostedZoneType
from app.models.user import User
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneResponse, HostedZoneUpdate
from app.schemas.pagination import Page

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


@router.get("", response_model=Page[HostedZoneResponse])
def list_hosted_zones(
    search: str | None = Query(default=None),
    zone_type: HostedZoneType | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Page[HostedZoneResponse]:
    return hosted_zone_controller.list_hosted_zones(
        db, search=search, zone_type=zone_type, sort_by=sort_by, sort_dir=sort_dir, page=page, page_size=page_size
    )


@router.post("", response_model=HostedZoneResponse, status_code=201)
def create_hosted_zone(
    payload: HostedZoneCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> HostedZoneResponse:
    return hosted_zone_controller.create_hosted_zone(db, payload, current_user)


@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(
    zone_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)
) -> HostedZoneResponse:
    return hosted_zone_controller.get_hosted_zone(db, zone_id)


@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(
    zone_id: int,
    payload: HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HostedZoneResponse:
    return hosted_zone_controller.update_hosted_zone(db, zone_id, payload, current_user)


@router.delete("/{zone_id}", status_code=204)
def delete_hosted_zone(
    zone_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    hosted_zone_controller.delete_hosted_zone(db, zone_id, current_user)
