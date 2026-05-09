import os
import secrets
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "PDF Fixer Pro"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/pdffixer")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "data/uploads")
    PROCESSED_DIR: str = os.getenv("PROCESSED_DIR", "data/processed")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    def __init__(self, **data):
        super().__init__(**data)
        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY environment variable is not set. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )

settings = Settings()
