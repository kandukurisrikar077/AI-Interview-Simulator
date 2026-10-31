import os
import secrets
import logging
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator

logger = logging.getLogger(__name__)

# Default local PostgreSQL connection URL
DEFAULT_DEV_POSTGRES_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/intervue_db"

INSECURE_DEFAULT_KEYS = {
    "supersecret_intervueai_key_change_me_in_prod_1234567890",
    "replace-this-with-a-secure-random-secret-key-for-jwt-signing",
    "your_production_secret_key_change_me",
    "secret",
    "changeme",
    "admin123"
}

class Settings(BaseSettings):
    PROJECT_NAME: str = "IntervueAI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # JWT Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))  # 60 Minutes
    
    # Database Settings - Standardized on PostgreSQL
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", None)
    
    # Sandboxed Code Execution Settings
    CODE_SANDBOX_TIMEOUT_SECONDS: float = float(os.getenv("CODE_SANDBOX_TIMEOUT_SECONDS", "3.0"))
    CODE_SANDBOX_MAX_CODE_CHARS: int = int(os.getenv("CODE_SANDBOX_MAX_CODE_CHARS", "10000"))

    # AI Keys
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # SMTP Settings
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", None)
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587")) if os.getenv("SMTP_PORT") else 587
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME", None)
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", None)
    SMTP_FROM_EMAIL: Optional[str] = os.getenv("SMTP_FROM_EMAIL", None)

    @model_validator(mode="after")
    def validate_security_settings(self):
        is_production = self.ENVIRONMENT.lower() in {"production", "prod"}

        # 1. Database URL Validation & Normalization - Standardized on PostgreSQL
        if is_production:
            if not self.DATABASE_URL:
                raise ValueError(
                    "FATAL CONFIGURATION ERROR: 'DATABASE_URL' environment variable is strictly required in production mode."
                )
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError(
                    "FATAL CONFIGURATION ERROR: SQLite is strictly prohibited in production. A valid PostgreSQL connection string is required."
                )
        else:
            # In development mode, default to local PostgreSQL if not explicitly provided
            if not self.DATABASE_URL:
                self.DATABASE_URL = DEFAULT_DEV_POSTGRES_URL

        # Normalize Postgres database URL (postgres:// or postgresql:// -> postgresql+psycopg2://)
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
        elif self.DATABASE_URL.startswith("postgresql://") and not self.DATABASE_URL.startswith("postgresql+"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

        # Ensure only PostgreSQL dialect is accepted in production
        if is_production and not self.DATABASE_URL.startswith("postgresql"):
            raise ValueError(
                "FATAL CONFIGURATION ERROR: Only PostgreSQL is supported as the database backend in production. "
                f"Received unsupported URL scheme: {self.DATABASE_URL.split('://')[0]}"
            )

        # 2. Enforce strict JWT SECRET_KEY requirements
        is_insecure = (not self.SECRET_KEY) or (self.SECRET_KEY in INSECURE_DEFAULT_KEYS) or (len(self.SECRET_KEY) < 32)

        if is_production and is_insecure:
            raise ValueError(
                "FATAL CONFIGURATION ERROR: A cryptographically strong SECRET_KEY "
                "(minimum 32 characters, non-default) must be configured in environment variables for production."
            )

        if not self.SECRET_KEY or self.SECRET_KEY in INSECURE_DEFAULT_KEYS:
            # Generate a secure development key if none provided locally
            logger.warning(
                "SECURITY NOTICE: No secure SECRET_KEY found in environment. "
                "Generating a secure 64-character ephemeral key for local development session."
            )
            self.SECRET_KEY = secrets.token_urlsafe(48)

        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
