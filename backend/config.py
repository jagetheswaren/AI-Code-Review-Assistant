from functools import cached_property
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    github_token: Optional[str] = None
    github_webhook_secret: Optional[str] = None
    ollama_model: str = "qwen2.5-coder:7b"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_timeout: int = 60
    ollama_max_code_chars: int = 12000
    flask_env: str = "development"
    flask_port: int = 5000
    cors_origins: str = "http://localhost:3000"
    jwt_secret: str = "your-super-secret-jwt-key-change-in-production"
    mongo_uri: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    github_oauth_callback_url: Optional[str] = None
    log_level: str = "INFO"
    ml_model_path: str = "ml/ml_model.pkl"
    nlp_model_name: str = "microsoft/codebert-base"
    groq_api_key: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @cached_property
    def allowed_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_production_settings(self) -> None:
        if self.flask_env.lower() != "production":
            return
        missing = []
        if not self.mongo_uri:
            missing.append("MONGO_URI")
        if not self.jwt_secret or self.jwt_secret == "your-super-secret-jwt-key-change-in-production":
            missing.append("JWT_SECRET")
        if not self.allowed_origins or any(origin.startswith("http://") for origin in self.allowed_origins):
            missing.append("CORS_ORIGINS (must contain HTTPS frontend URL(s))")
        if missing:
            raise RuntimeError("Production configuration is incomplete: " + ", ".join(missing))


settings = Settings()
