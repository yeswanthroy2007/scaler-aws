from __future__ import annotations

from sqlalchemy.orm import Session

from app.schemas.search import SearchResponse
from app.services.search_service import SearchService


def search(db: Session, query: str) -> SearchResponse:
    return SearchService(db).search(query)
