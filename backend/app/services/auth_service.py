from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import create_session_token, decode_session_token, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def login(self, *, email: str, password: str) -> tuple[User, str]:
        user = self.users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")
        token = create_session_token(user.id)
        return user, token

    def get_user_from_token(self, token: str) -> User:
        payload = decode_session_token(token)
        if payload is None:
            raise UnauthorizedError("Session expired or invalid, please sign in again")
        user = self.users.get_by_id(payload.user_id)
        if user is None:
            raise UnauthorizedError("Session is no longer valid")
        return user
