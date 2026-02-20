from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str
    
    # Use database URL for Alembic if not provided
    DATABASE_URL: str
    REDIS_URL: str
    
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASS: str
    
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "https://healthq.vercel.app"]
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()