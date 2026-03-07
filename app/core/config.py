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
    REDIS_URL: str = "redis://localhost:6379/0"

    # External Services
    GEMINI_API_KEY: str | None = None
    CLOUDFLARE_API_TOKEN: str | None = None
    CLOUDFLARE_ACCOUNT_ID: str | None = None
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None

    
    # AWS & S3 Media Config
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "eu-central-1"
    AWS_BUCKET_NAME: str = "santis-media-global"
    CDN_DOMAIN: str = "" # e.g. https://cdn.santis.club

    class Config:
        env_file = ".env"
        extra = "ignore"
        env_file_encoding = 'utf-8'

settings = Settings()
