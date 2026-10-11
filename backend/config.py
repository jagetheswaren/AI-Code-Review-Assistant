import os
from functools import cached_property
from typing import Optional

from pydantic import AliasChoices, Field
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
    github_oauth_callback_url: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("GITHUB_OAUTH_CALLBACK_URL", "GITHUB_CALLBACK_URL"),
    )
    log_level: str = "INFO"
    ml_model_path: str = "ml/ml_model.pkl"
    nlp_model_name: str = "microsoft/codebert-base"
    groq_api_key: Optional[str] = None
    groq_model: str = "openai/gpt-oss-120b"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @cached_property
    def allowed_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_settings(self) -> None:
        missing = []
        if not self.mongo_uri and not os.getenv("MONGO_URI"):
            # Technically init_mongo defaults to localhost, but explicit check requested
            missing.append("MONGO_URI")
        if not self.jwt_secret or self.jwt_secret == "your-super-secret-jwt-key-change-in-production":
            if self.flask_env.lower() == "production":
                missing.append("JWT_SECRET (cannot use default in production)")
        
        # Check AI provider
        # If Groq is not configured, we assume Ollama. Ollama needs a URL.
        if not self.groq_api_key and not self.ollama_base_url:
            missing.append("AI Provider Key (either GROQ_API_KEY or OLLAMA_BASE_URL must be set)")

        if self.flask_env.lower() == "production":
            if not self.allowed_origins or any(origin.startswith("http://") for origin in self.allowed_origins):
                missing.append("CORS_ORIGINS (must contain HTTPS frontend URL(s))")
                
        if missing:
            import sys
            print("CRITICAL: Application cannot start due to missing or invalid configuration:")
            for m in missing:
                print(f"  - {m}")
            sys.exit(1)


settings = Settings()
