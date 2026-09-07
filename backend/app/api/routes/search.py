from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.controllers import search_controller
from app.core.database import get_db
from app.models.user import User
from app.schemas.search import SearchResponse

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def global_search(
    q: str = Query(default="", max_length=200),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> SearchResponse:
    return search_controller.search(db, q)
