from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.hosted_zone import HostedZoneType
from app.models.user import User
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneResponse, HostedZoneUpdate
from app.schemas.pagination import Page
from app.services.hosted_zone_service import HostedZoneService


def list_hosted_zones(
    db: Session,
    *,
    search: str | None,
    zone_type: HostedZoneType | None,
    sort_by: str,
    sort_dir: str,
    page: int,
    page_size: int,
) -> Page[HostedZoneResponse]:
    return HostedZoneService(db).list_zones(
        search=search, zone_type=zone_type, sort_by=sort_by, sort_dir=sort_dir, page=page, page_size=page_size
    )


def get_hosted_zone(db: Session, zone_id: int) -> HostedZoneResponse:
    return HostedZoneService(db).get_zone(zone_id)


def create_hosted_zone(db: Session, payload: HostedZoneCreate, current_user: User) -> HostedZoneResponse:
    result = HostedZoneService(db).create_zone(payload, owner_id=current_user.id)
    db.commit()
    return result


def update_hosted_zone(db: Session, zone_id: int, payload: HostedZoneUpdate, current_user: User) -> HostedZoneResponse:
    result = HostedZoneService(db).update_zone(zone_id, payload, user_id=current_user.id)
    db.commit()
    return result


def delete_hosted_zone(db: Session, zone_id: int, current_user: User) -> None:
    HostedZoneService(db).delete_zone(zone_id, user_id=current_user.id)
    db.commit()
