from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    github_token: Optional[str] = None
    github_webhook_secret: Optional[str] = None
    ollama_model: str = "qwen2.5-coder:3b"
    ollama_base_url: str = "http://localhost:11434"
    flask_env: str = "development"
    flask_port: int = 5000
    cors_origins: str = "http://localhost:3000"
    jwt_secret: str = "your-super-secret-jwt-key-change-in-production"
    mongo_uri: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()