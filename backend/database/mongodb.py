"""MongoDB access with lazy, injectable clients for application and test use."""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING, MongoClient

from models.mongodb_models import ScanRecord, User


client = None
db = None
_database_name = "code_review_assistant"


def init_mongo(
    uri: Optional[str] = None,
    *,
    mongo_client=None,
    database_name: str = "code_review_assistant",
):
    """Configure the active database and create its indexes.

    ``mongo_client`` allows tests to supply an in-memory mongomock client without
    modifying environment variables or requiring a running MongoDB server.
    """
    global client, db, _database_name
    _database_name = database_name
    client = mongo_client or MongoClient(
        uri or os.getenv("MONGO_URI", "mongodb://localhost:27017"),
        serverSelectionTimeoutMS=5_000,
        connectTimeoutMS=5_000,
    )
    db = client.get_database(_database_name)

    db.users.create_index("email", unique=True)
    db.users.create_index("username", unique=True)
    db.scans.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    db.scans.create_index("request_id", unique=True)
    return db


def reset_mongo() -> None:
    """Clear the configured client. Intended for isolated test setup."""
    global client, db
    if client is not None:
        client.close()
    client = None
    db = None


def get_db():
    global db
    if db is None:
        init_mongo()
    return db


def _object_id(value: Any) -> Any:
    return ObjectId(value) if isinstance(value, str) and ObjectId.is_valid(value) else value


class UserService:
    @property
    def collection(self):
        return get_db().users

    def create_user(self, username: str, email: str, password_hash: str) -> User:
        user_doc = {"username": username, "email": email, "password_hash": password_hash,
                    "created_at": datetime.utcnow(), "last_login": None, "is_active": True}
        result = self.collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return User(**user_doc)

    def get_user_by_email(self, email: str) -> Optional[User]:
        doc = self.collection.find_one({"email": email})
        return User(**doc) if doc else None

    def get_user_by_username(self, username: str) -> Optional[User]:
        doc = self.collection.find_one({"username": username})
        return User(**doc) if doc else None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        doc = self.collection.find_one({"_id": _object_id(user_id)})
        return User(**doc) if doc else None

    def update_last_login(self, user_id: str) -> None:
        self.collection.update_one({"_id": _object_id(user_id)}, {"$set": {"last_login": datetime.utcnow()}})


class ScanService:
    @property
    def collection(self):
        return get_db().scans

    def create_scan(self, scan: ScanRecord) -> ScanRecord:
        scan_dict = scan.model_dump(by_alias=True, exclude={"id"})
        result = self.collection.insert_one(scan_dict)
        scan.id = result.inserted_id
        return scan

    def get_user_scans(self, user_id: str, limit: int = 50, skip: int = 0, *, page: Optional[int] = None,
                       per_page: Optional[int] = None) -> List[ScanRecord]:
        if page is not None:
            limit = per_page or 20
            skip = (max(page, 1) - 1) * limit
        cursor = self.collection.find({"user_id": _object_id(user_id)}).sort("timestamp", DESCENDING).skip(skip).limit(limit)
        return [ScanRecord(**doc) for doc in cursor]

    def get_scan_by_id(self, scan_id: str) -> Optional[ScanRecord]:
        doc = self.collection.find_one({"_id": _object_id(scan_id)})
        return ScanRecord(**doc) if doc else None

    def get_scan_by_request_id(self, request_id: str) -> Optional[ScanRecord]:
        doc = self.collection.find_one({"request_id": request_id})
        return ScanRecord(**doc) if doc else None

    def get_user_scan_stats(self, user_id: str) -> Dict[str, Any]:
        scans = self.get_user_scans(user_id, limit=0)
        risks: Dict[str, int] = {}
        total_issues = 0
        for scan in scans:
            total_issues += scan.summary.total_issues
            risk = scan.summary.overall_risk
            risks[risk] = risks.get(risk, 0) + 1
        return {"total_scans": len(scans), "total_issues": total_issues,
                "avg_issues": round(total_issues / len(scans), 1) if scans else 0,
                "risk_distribution": risks}

    def get_issues_over_time(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        since = datetime.utcnow() - timedelta(days=days)
        pipeline = [{"$match": {"user_id": _object_id(user_id), "timestamp": {"$gte": since}}},
                    {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                     "total_issues": {"$sum": "$summary.total_issues"}, "security": {"$sum": "$summary.by_type.security"},
                     "code_smell": {"$sum": "$summary.by_type.code_smell"}, "performance": {"$sum": "$summary.by_type.performance"},
                     "best_practice": {"$sum": "$summary.by_type.best_practice"}, "critical": {"$sum": "$summary.by_severity.critical"},
                     "high": {"$sum": "$summary.by_severity.high"}, "medium": {"$sum": "$summary.by_severity.medium"},
                     "low": {"$sum": "$summary.by_severity.low"}, "info": {"$sum": "$summary.by_severity.info"}}},
                    {"$sort": {"_id": 1}}]
        return list(self.collection.aggregate(pipeline))

    def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        stats = self.get_user_scan_stats(user_id)
        recent = self.get_user_scans(user_id, limit=1)
        return {**stats, "avg_issues_per_scan": stats["avg_issues"],
                "last_scan": recent[0].model_dump(by_alias=True, mode="json") if recent else None}


# These services no longer connect at import time; their collections resolve lazily.
user_service = UserService()
scan_service = ScanService()
