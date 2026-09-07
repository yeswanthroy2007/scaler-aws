from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.hosted_zone import HostedZone, HostedZoneType
from app.repositories.hosted_zone_repository import HostedZoneRepository
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneResponse, HostedZoneUpdate
from app.schemas.pagination import Page, build_page
from app.services.audit_service import AuditService
from app.utils.dns_helpers import generate_name_servers


class HostedZoneService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = HostedZoneRepository(db)
        self.audit = AuditService(db)

    def _to_response(self, zone: HostedZone) -> HostedZoneResponse:
        count = self.repo.count_records(zone.id)
        return HostedZoneResponse.from_model(zone, count)

    def list_zones(
        self,
        *,
        search: str | None,
        zone_type: HostedZoneType | None,
        sort_by: str,
        sort_dir: str,
        page: int,
        page_size: int,
    ) -> Page[HostedZoneResponse]:
        zones, total = self.repo.list_paginated(
            search=search, zone_type=zone_type, sort_by=sort_by, sort_dir=sort_dir, page=page, page_size=page_size
        )
        items = [self._to_response(zone) for zone in zones]
        return build_page(items, total, page, page_size)

    def get_zone(self, zone_id: int) -> HostedZoneResponse:
        zone = self.repo.get_by_id(zone_id)
        if zone is None:
            raise NotFoundError(f"Hosted zone {zone_id} was not found")
        return self._to_response(zone)

    def get_zone_or_raise(self, zone_id: int) -> HostedZone:
        zone = self.repo.get_by_id(zone_id)
        if zone is None:
            raise NotFoundError(f"Hosted zone {zone_id} was not found")
        return zone

    def create_zone(self, payload: HostedZoneCreate, *, owner_id: int) -> HostedZoneResponse:
        existing = self.repo.get_by_domain(payload.domain_name)
        if existing is not None:
            raise ConflictError(f"A hosted zone for '{payload.domain_name}' already exists")

        zone = HostedZone(
            domain_name=payload.domain_name,
            description=payload.description,
            zone_type=payload.zone_type,
            vpc_id=payload.vpc_id,
            vpc_region=payload.vpc_region,
            owner_id=owner_id,
            name_servers="\n".join(generate_name_servers(payload.domain_name)),
        )
        zone = self.repo.create(zone)
        self.audit.record(
            user_id=owner_id,
            action="create",
            resource_type="hosted_zone",
            resource_id=zone.zone_id,
            resource_label=zone.domain_name,
        )
        return self._to_response(zone)

    def update_zone(self, zone_id: int, payload: HostedZoneUpdate, *, user_id: int) -> HostedZoneResponse:
        zone = self.get_zone_or_raise(zone_id)
        if payload.description is not None:
            zone.description = payload.description
        if payload.comment is not None:
            zone.comment = payload.comment
        zone = self.repo.update(zone)
        self.audit.record(
            user_id=user_id, action="update", resource_type="hosted_zone", resource_id=zone.zone_id, resource_label=zone.domain_name
        )
        return self._to_response(zone)

    def delete_zone(self, zone_id: int, *, user_id: int) -> None:
        zone = self.get_zone_or_raise(zone_id)
        domain_name = zone.domain_name
        zone_identifier = zone.zone_id
        self.repo.delete(zone)
        self.audit.record(
            user_id=user_id, action="delete", resource_type="hosted_zone", resource_id=zone_identifier, resource_label=domain_name
        )
