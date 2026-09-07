from __future__ import annotations

from sqlalchemy.orm import Session

from app.services.export_service import ExportService


def export_hosted_zone(db: Session, hosted_zone_id: int, fmt: str) -> tuple[str, str, str]:
    return ExportService(db).export(hosted_zone_id, fmt)
