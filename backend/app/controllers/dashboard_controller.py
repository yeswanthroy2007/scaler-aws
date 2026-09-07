from __future__ import annotations

from sqlalchemy.orm import Session

from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import DashboardService


def get_dashboard_summary(db: Session) -> DashboardSummary:
    return DashboardService(db).get_summary()
