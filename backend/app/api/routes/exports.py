from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.controllers import export_controller
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/export", tags=["export"])


@router.get("")
def export_hosted_zone(
    zone_id: int,
    format: str = Query(default="json", pattern="^(json|bind)$"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> PlainTextResponse:
    content, media_type, filename = export_controller.export_hosted_zone(db, zone_id, format)
    return PlainTextResponse(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
