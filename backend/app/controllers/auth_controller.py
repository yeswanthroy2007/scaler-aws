from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.services.auth_service import AuthService


def login(db: Session, payload: LoginRequest) -> tuple[LoginResponse, str]:
    user, token = AuthService(db).login(email=payload.email, password=payload.password)
    return LoginResponse(user=UserResponse.model_validate(user), token=token), token


def get_current_user_profile(current_user: User) -> UserResponse:
    return UserResponse.model_validate(current_user)
