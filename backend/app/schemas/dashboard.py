from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ActivityItem(BaseModel):
    id: int
    action: str
    resource_type: str
    resource_id: str
    resource_label: str | None
    user_name: str | None
    created_at: datetime


class DashboardSummary(BaseModel):
    total_zones: int
    public_zones: int
    private_zones: int
    total_records: int
    recent_activity: list[ActivityItem]
