import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health
import os
from sqlalchemy import create_engine
import redis

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI-Code-Review-Assistant API",
    description="API for the AI-powered code review platform",
    version="0.1.0",
)

# Environment configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/code_review_assistant")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Database connection (SQLAlchemy)
try:
    engine = create_engine(DATABASE_URL)
    logger.info("Successfully configured PostgreSQL engine.")
except Exception as e:
    logger.error(f"Failed to configure PostgreSQL engine: {e}")

# Setup Redis connection
try:
    redis_client = redis.Redis.from_url(REDIS_URL)
    logger.info("Successfully configured Redis client.")
except Exception as e:
    logger.error(f"Failed to configure Redis client: {e}")

app.include_router(health.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up backend service...")
    # Test DB Connection
    try:
        with engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL on startup.")
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {e}")
        
    # Test Redis Connection
    try:
        if redis_client.ping():
            logger.info("Successfully connected to Redis on startup.")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to AI-Code-Review-Assistant API"}
