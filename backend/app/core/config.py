import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "ContractIQ API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: Supports PostgreSQL or fallback to SQLite
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'contractiq.db'}"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Storage
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    VECTOR_INDEX_DIR: Path = BASE_DIR / "storage" / "vectors"
    
    # AI / LLM Configuration
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "mock" # "gemini", "openai", or "mock"
    
    # Tesseract OCR Command Path (Optional Windows fallback)
    TESSERACT_CMD: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure storage directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.VECTOR_INDEX_DIR.mkdir(parents=True, exist_ok=True)
