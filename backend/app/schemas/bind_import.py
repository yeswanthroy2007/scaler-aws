from __future__ import annotations

from pydantic import BaseModel

from app.schemas.dns_record import DnsRecordCreate


class ParsedRecordPreview(BaseModel):
    line_number: int
    raw_line: str
    record: DnsRecordCreate | None = None
    error: str | None = None


class BindImportPreviewResponse(BaseModel):
    zone_id: int
    total_lines_parsed: int
    valid_count: int
    invalid_count: int
    preview: list[ParsedRecordPreview]
    import_token: str


class BindImportConfirmRequest(BaseModel):
    import_token: str
    skip_invalid: bool = True


class BindImportSummary(BaseModel):
    created: int
    skipped: int
    failed: int
    failures: list[str] = []
