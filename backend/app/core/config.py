from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "PDF Fixer Pro"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/pdffixer"
    UPLOAD_DIR: str = "data/uploads"
    PROCESSED_DIR: str = "data/processed"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    def __init__(self, **data):
        super().__init__(**data)
        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY environment variable is not set. "
                'Generate one with: python -c "import secrets; print(secrets.token_hex(32))"'
            )

settings = Settings()
