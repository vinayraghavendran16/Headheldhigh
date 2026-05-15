from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    RAPIDAPI_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./headheldhigh.db"
    FRONTEND_URL: str = "http://localhost:5173"
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
