from pymongo import MongoClient
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class Database:
    _client = None
    _db = None
    
    @classmethod
    def get_client(cls):
        if cls._client is None:
            try:
                cls._client = MongoClient(current_app.config['MONGO_URI'])
                cls._db = cls._client[current_app.config['MONGO_DB_NAME']]
                cls._create_indexes()
                logger.info("MongoDB connection established")
            except Exception as e:
                logger.error(f"MongoDB connection failed: {e}")
                raise
        return cls._client
    
    @classmethod
    def get_db(cls):
        if cls._db is None:
            cls.get_client()
        return cls._db
    
    @classmethod
    def _create_indexes(cls):
        db = cls._db
        
        db.users.create_index("email", unique=True)
        db.users.create_index("github_id", unique=True, sparse=True)
        
        db.repositories.create_index("github_id", unique=True)
        db.repositories.create_index("owner")
        
        db.pull_requests.create_index([("repository_id", 1), ("number", 1)], unique=True)
        db.pull_requests.create_index("status")
        
        db.analysis_reports.create_index([("pull_request_id", 1), ("created_at", -1)])
        
        db.security_issues.create_index("pull_request_id")
        db.security_issues.create_index("severity")
        
        db.performance_issues.create_index("pull_request_id")
        db.performance_issues.create_index("severity")
        
        db.code_smells.create_index("pull_request_id")
        db.code_smells.create_index("severity")
        
        db.activity_logs.create_index([("user_id", 1), ("created_at", -1)])
        
        logger.info("Database indexes created")
    
    @classmethod
    def close(cls):
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
            logger.info("MongoDB connection closed")

def get_db():
    return Database.get_db()

def close_db():
    Database.close()