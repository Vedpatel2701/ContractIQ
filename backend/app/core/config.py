import json
import logging
import os
from pathlib import Path
from typing import List, Union, Optional, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DEV_SECRET = "contractiq-super-secret-jwt-key-2026-production-secure"


class Settings(BaseSettings):
    PROJECT_NAME: str = "ContractIQ API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Environment: development, production, test
    ENVIRONMENT: str = "development"

    # Database: Supports Neon/Hosted PostgreSQL or local fallback to SQLite
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'contractiq.db'}"

    # Security & Authentication
    SECRET_KEY: str = DEFAULT_DEV_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS: Accepts list of origins or comma-separated string from environment
    CORS_ORIGINS: Union[List[str], str] = [
        "https://contract-iq-lime.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Storage paths
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    VECTOR_INDEX_DIR: Path = BASE_DIR / "storage" / "vectors"

    # AI / LLM Configuration
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "gemini"  # "gemini", "openai", or "mock"

    # Tesseract OCR Command Path (Optional custom override; auto-discovered if not set)
    TESSERACT_CMD: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: Any) -> str:
        if isinstance(v, str):
            clean = v.strip().strip("'\"")
            # Normalize PostgreSQL connection schemes to consistently use the installed psycopg2 driver
            if clean.startswith("postgresql+psycopg://"):
                clean = "postgresql+psycopg2://" + clean[len("postgresql+psycopg://"):]
            elif clean.startswith("postgres://"):
                clean = "postgresql+psycopg2://" + clean[len("postgres://"):]
            elif clean.startswith("postgresql://"):
                clean = "postgresql+psycopg2://" + clean[len("postgresql://"):]
            return clean
        return str(v)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> Union[List[str], str]:
        if isinstance(v, str):
            raw = v.strip()
            if raw.startswith("[") and raw.endswith("]"):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if item]
                except Exception:
                    pass
            # Split comma-separated string
            return [s.strip() for s in raw.split(",") if s.strip()]
        return v

    @property
    def is_production(self) -> bool:
        """Determines if the application is running in a production deployment environment."""
        env_val = self.ENVIRONMENT.lower().strip()
        return (
            env_val in ("production", "prod")
            or os.getenv("RENDER") is not None
            or os.getenv("RENDER_SERVICE_ID") is not None
        )

    @property
    def parsed_cors_origins(self) -> List[str]:
        """Returns a sanitized list of CORS origins."""
        origins: List[str] = []
        if isinstance(self.CORS_ORIGINS, list):
            origins = [str(item).strip() for item in self.CORS_ORIGINS if str(item).strip()]
        elif isinstance(self.CORS_ORIGINS, str):
            origins = [s.strip() for s in self.CORS_ORIGINS.split(",") if s.strip()]

        # Ensure deployed production frontend and local development hosts are always permitted
        default_origins = [
            "https://contract-iq-lime.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        for d in default_origins:
            norm_d = d.rstrip("/")
            if norm_d not in [o.rstrip("/") for o in origins]:
                origins.append(norm_d)

        # Normalize all origins: strip trailing slashes (browsers send Origin header without trailing slash)
        cleaned_origins: List[str] = []
        for o in origins:
            clean = o.rstrip("/")
            if clean and clean not in cleaned_origins:
                cleaned_origins.append(clean)

        return cleaned_origins

    def validate_production_configuration(self) -> None:
        """
        Validates critical security and infrastructure settings before running in production.
        Fails fast with clear, actionable error messages.
        """
        if not self.is_production:
            return

        # 1. Enforce external PostgreSQL in production (no silent SQLite fallback)
        if self.DATABASE_URL.startswith("sqlite"):
            raise RuntimeError(
                "[Startup Safety Error] SQLite is not permitted in production. "
                "Ensure the DATABASE_URL environment variable is configured with your hosted PostgreSQL / Neon connection string."
            )

        # 2. Enforce strong, explicit SECRET_KEY in production
        if not self.SECRET_KEY or self.SECRET_KEY == DEFAULT_DEV_SECRET or len(self.SECRET_KEY) < 32:
            raise RuntimeError(
                "[Startup Security Error] Insecure or default SECRET_KEY detected in production. "
                "You must configure a strong, random SECRET_KEY (at least 32 characters) in your environment variables."
            )

        # 3. Check Gemini API key if gemini is the configured provider
        if self.DEFAULT_LLM_PROVIDER == "gemini" and not self.GEMINI_API_KEY:
            logger.warning(
                "[Configuration Warning] GEMINI_API_KEY is not configured while DEFAULT_LLM_PROVIDER=gemini. "
                "AI document analysis may fall back to mock responses or encounter authorization errors."
            )

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Ensure storage directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.VECTOR_INDEX_DIR.mkdir(parents=True, exist_ok=True)
