from __future__ import annotations

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.controllers import import_controller
from app.core.database import get_db
from app.models.user import User
from app.schemas.bind_import import BindImportConfirmRequest, BindImportPreviewResponse, BindImportSummary

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/import", tags=["import"])


@router.post("/preview", response_model=BindImportPreviewResponse)
async def preview_import(
    zone_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BindImportPreviewResponse:
    content = await file.read()
    return import_controller.preview_import(db, zone_id, file.filename or "upload.txt", content, current_user)


@router.post("/confirm", response_model=BindImportSummary)
def confirm_import(
    zone_id: int,
    payload: BindImportConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BindImportSummary:
    return import_controller.confirm_import(db, zone_id, payload, current_user)
