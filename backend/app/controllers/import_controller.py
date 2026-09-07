from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import FileTooLargeError, ValidationError
from app.models.user import User
from app.schemas.bind_import import BindImportConfirmRequest, BindImportPreviewResponse, BindImportSummary
from app.services.bind_service import BindImportService

settings = get_settings()

_ALLOWED_EXTENSIONS = (".txt", ".zone", ".bind", ".db")


def preview_import(db: Session, hosted_zone_id: int, filename: str, content: bytes, current_user: User) -> BindImportPreviewResponse:
    if not any(filename.lower().endswith(ext) for ext in _ALLOWED_EXTENSIONS):
        raise ValidationError(f"Unsupported file type. Allowed extensions: {', '.join(_ALLOWED_EXTENSIONS)}")
    if len(content) > settings.max_import_file_size_bytes:
        raise FileTooLargeError(f"File exceeds the maximum size of {settings.max_import_file_size_bytes // 1024} KB")
    if len(content) == 0:
        raise ValidationError("Uploaded file is empty")

    return BindImportService(db).preview(hosted_zone_id, content, user_id=current_user.id)


def confirm_import(db: Session, hosted_zone_id: int, payload: BindImportConfirmRequest, current_user: User) -> BindImportSummary:
    result = BindImportService(db).confirm(hosted_zone_id, payload.import_token, user_id=current_user.id)
    db.commit()
    return result
