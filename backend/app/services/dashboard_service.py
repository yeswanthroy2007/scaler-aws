from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.hosted_zone import HostedZoneType
from app.repositories.audit_repository import AuditRepository
from app.repositories.dns_record_repository import DnsRecordRepository
from app.repositories.hosted_zone_repository import HostedZoneRepository
from app.schemas.dashboard import ActivityItem, DashboardSummary


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.zones = HostedZoneRepository(db)
        self.records = DnsRecordRepository(db)
        self.audit = AuditRepository(db)

    def get_summary(self) -> DashboardSummary:
        recent = self.audit.list_recent(limit=8)
        return DashboardSummary(
            total_zones=self.zones.count_all(),
            public_zones=self.zones.count_by_type(HostedZoneType.PUBLIC),
            private_zones=self.zones.count_by_type(HostedZoneType.PRIVATE),
            total_records=self.records.count_all(),
            recent_activity=[
                ActivityItem(
                    id=entry.id,
                    action=entry.action,
                    resource_type=entry.resource_type,
                    resource_id=entry.resource_id,
                    resource_label=entry.resource_label,
                    user_name=entry.user.name if entry.user else None,
                    created_at=entry.created_at,
                )
                for entry in recent
            ],
        )
