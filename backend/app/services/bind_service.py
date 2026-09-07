from __future__ import annotations

import secrets
import time
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.repositories.hosted_zone_repository import HostedZoneRepository
from app.schemas.bind_import import BindImportPreviewResponse, BindImportSummary, ParsedRecordPreview
from app.schemas.dns_record import DnsRecordCreate
from app.services.audit_service import AuditService
from app.services.dns_record_service import DnsRecordService
from app.utils.parsers import parse_bind_zone

_PENDING_TTL_SECONDS = 15 * 60


@dataclass
class _PendingImport:
    hosted_zone_id: int
    user_id: int
    records: list[DnsRecordCreate]
    created_at: float


class BindImportService:
    """Holds an in-process staging area for parsed-but-not-yet-committed imports.

    A real multi-instance deployment would persist this in the database or a
    cache like Redis; for this single-process SQLite console clone, an
    in-memory store keyed by an opaque token is sufficient and keeps the
    preview/confirm flow simple.
    """

    _pending: dict[str, _PendingImport] = {}

    def __init__(self, db: Session) -> None:
        self.db = db
        self.zones = HostedZoneRepository(db)
        self.records = DnsRecordService(db)
        self.audit = AuditService(db)

    def _prune_expired(self) -> None:
        now = time.time()
        expired = [token for token, item in self._pending.items() if now - item.created_at > _PENDING_TTL_SECONDS]
        for token in expired:
            self._pending.pop(token, None)

    def preview(self, hosted_zone_id: int, file_content: bytes, *, user_id: int) -> BindImportPreviewResponse:
        self._prune_expired()

        zone = self.zones.get_by_id(hosted_zone_id)
        if zone is None:
            raise NotFoundError(f"Hosted zone {hosted_zone_id} was not found")

        try:
            text = file_content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValidationError("File must be UTF-8 encoded text") from exc

        parsed = parse_bind_zone(text)

        preview_items: list[ParsedRecordPreview] = []
        valid_records: list[DnsRecordCreate] = []
        for item in parsed:
            preview_items.append(
                ParsedRecordPreview(line_number=item.line_number, raw_line=item.raw_line, record=item.record, error=item.error)
            )
            if item.record is not None:
                valid_records.append(item.record)

        token = secrets.token_urlsafe(24)
        self._pending[token] = _PendingImport(
            hosted_zone_id=hosted_zone_id, user_id=user_id, records=valid_records, created_at=time.time()
        )

        invalid_count = sum(1 for item in parsed if item.error is not None)
        return BindImportPreviewResponse(
            zone_id=hosted_zone_id,
            total_lines_parsed=len(parsed),
            valid_count=len(valid_records),
            invalid_count=invalid_count,
            preview=preview_items,
            import_token=token,
        )

    def confirm(self, hosted_zone_id: int, import_token: str, *, user_id: int) -> BindImportSummary:
        self._prune_expired()
        pending = self._pending.get(import_token)
        if pending is None or pending.hosted_zone_id != hosted_zone_id:
            raise ValidationError("This import session has expired. Please re-upload the file.")

        created = 0
        skipped = 0
        failed = 0
        failures: list[str] = []

        for record_payload in pending.records:
            try:
                self.records.create_record(hosted_zone_id, record_payload, user_id=user_id)
                created += 1
            except Exception as exc:  # noqa: BLE001 - surfaced per-record in the summary, not raised
                if "already exists" in str(exc) or "already has" in str(exc):
                    skipped += 1
                else:
                    failed += 1
                    failures.append(f"{record_payload.name or '@'} ({record_payload.type.value}): {exc}")

        self._pending.pop(import_token, None)
        self.audit.record(
            user_id=user_id,
            action="import",
            resource_type="hosted_zone",
            resource_id=str(hosted_zone_id),
            metadata={"created": created, "skipped": skipped, "failed": failed},
        )
        return BindImportSummary(created=created, skipped=skipped, failed=failed, failures=failures)
