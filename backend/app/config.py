"""
Centralized application configuration.

All settings are loaded from environment variables (or a local .env file).
Keeping configuration in one place makes it trivial to change behaviour
between local development, Docker, and a hosted deployment without
touching any business logic.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "InsightAI"
    environment: str = "development"

    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    database_url: str = "sqlite:///./insightai.db"

    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    upload_dir: str = "storage/uploads"
    model_dir: str = "storage/models"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", protected_namespaces=("settings_",))

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
