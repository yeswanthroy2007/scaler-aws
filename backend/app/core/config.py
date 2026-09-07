from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, populated from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Route53 Console Clone API"
    environment: str = "development"

    database_url: str = "sqlite:///./route53.db"

    # Used to sign mock session tokens (HMAC). Never used for real cryptographic
    # security guarantees -- authentication in this project is intentionally mocked.
    session_secret_key: str = "dev-insecure-secret-change-me"
    session_ttl_seconds: int = 60 * 60 * 12  # 12 hours

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    max_import_file_size_bytes: int = 1 * 1024 * 1024  # 1 MB

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
