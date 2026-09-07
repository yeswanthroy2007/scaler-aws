from __future__ import annotations

from fastapi import Cookie, Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.models.user import User
from app.services.auth_service import AuthService

SESSION_COOKIE_NAME = "r53_session"


def _extract_token(authorization: str | None, session_cookie: str | None) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:]
    if session_cookie:
        return session_cookie
    raise UnauthorizedError("Authentication required")


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    r53_session: str | None = Cookie(default=None),
) -> User:
    token = _extract_token(authorization, r53_session)
    return AuthService(db).get_user_from_token(token)
