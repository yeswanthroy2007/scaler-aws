from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.repositories.audit_repository import AuditRepository


class AuditService:
    def __init__(self, db: Session) -> None:
        self.repo = AuditRepository(db)

    def record(
        self,
        *,
        user_id: int | None,
        action: str,
        resource_type: str,
        resource_id: str,
        resource_label: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.repo.create(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_label=resource_label,
            metadata_json=json.dumps(metadata) if metadata else None,
        )
