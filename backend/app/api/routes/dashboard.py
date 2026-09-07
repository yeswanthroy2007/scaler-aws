from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.controllers import dashboard_controller
from app.core.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> DashboardSummary:
    return dashboard_controller.get_dashboard_summary(db)
