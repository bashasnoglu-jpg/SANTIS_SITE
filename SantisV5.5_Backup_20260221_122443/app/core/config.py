from pydantic_settings import BaseSettings
from pydantic import EmailStr

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "changethis_in_production_please"
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = "sqlite+aiosqlite:///./santis.db"

    # Admin & Security
    ADMIN_SECRET_TOKEN: str = "changeme"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD_HASH: str = "changeme"
    SESSION_SECRET: str = "super-secret-session-key"

    # External Services
    GEMINI_API_KEY: str | None = None
    CLOUDFLARE_API_TOKEN: str | None = None
    CLOUDFLARE_ACCOUNT_ID: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"
        env_file_encoding = 'utf-8'

settings = Settings()
