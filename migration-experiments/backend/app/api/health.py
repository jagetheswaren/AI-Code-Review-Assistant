from fastapi import APIRouter
import logging
from sqlalchemy import create_engine
import redis
import os

router = APIRouter()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/code_review_assistant")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

engine = create_engine(DATABASE_URL)
redis_client = redis.Redis.from_url(REDIS_URL)

@router.get("/health")
def health_check():
    db_status = "ok"
    redis_status = "ok"
    
    try:
        with engine.connect() as conn:
            pass
    except Exception as e:
        db_status = f"failed: {e}"
        logger.error(f"Health check DB error: {e}")
        
    try:
        redis_client.ping()
    except Exception as e:
        redis_status = f"failed: {e}"
        logger.error(f"Health check Redis error: {e}")

    return {
        "status": "ok",
        "service": "AI-Code-Review-Assistant Backend",
        "postgres_connection": db_status,
        "redis_connection": redis_status
    }
