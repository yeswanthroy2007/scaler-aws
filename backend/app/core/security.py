"""Mock authentication primitives.

This project intentionally implements *mock* authentication (per the assignment
spec, no real IAM/OAuth is required). Passwords are hashed with PBKDF2-HMAC
(stdlib `hashlib`, no native extensions required) and sessions are opaque,
HMAC-signed, expiring tokens -- not JWT, to keep the dependency footprint
minimal, but following the same "signed + expiring" shape.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass

from app.core.config import get_settings

settings = get_settings()

_PBKDF2_ITERATIONS = 260_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations_str, salt_b64, digest_b64 = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_str)
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
    except (ValueError, TypeError):
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(candidate, expected)


@dataclass(frozen=True)
class SessionTokenPayload:
    user_id: int
    issued_at: float


def _sign(message: bytes) -> str:
    signature = hmac.new(settings.session_secret_key.encode("utf-8"), message, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(signature).decode().rstrip("=")


def create_session_token(user_id: int) -> str:
    payload = {"user_id": user_id, "issued_at": time.time()}
    payload_bytes = json.dumps(payload).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode().rstrip("=")
    signature = _sign(payload_b64.encode("utf-8"))
    return f"{payload_b64}.{signature}"


def decode_session_token(token: str) -> SessionTokenPayload | None:
    try:
        payload_b64, signature = token.split(".")
    except ValueError:
        return None

    expected_signature = _sign(payload_b64.encode("utf-8"))
    if not hmac.compare_digest(signature, expected_signature):
        return None

    try:
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        issued_at = float(payload["issued_at"])
        user_id = int(payload["user_id"])
    except (ValueError, KeyError, TypeError):
        return None

    if time.time() - issued_at > settings.session_ttl_seconds:
        return None

    return SessionTokenPayload(user_id=user_id, issued_at=issued_at)
