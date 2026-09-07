from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        user_id: int | None,
        action: str,
        resource_type: str,
        resource_id: str,
        resource_label: str | None = None,
        metadata_json: str | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_label=resource_label,
            metadata_json=metadata_json,
        )
        self.db.add(entry)
        self.db.flush()
        return entry

    def list_recent(self, limit: int = 20) -> list[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        return list(self.db.execute(stmt).scalars().all())
