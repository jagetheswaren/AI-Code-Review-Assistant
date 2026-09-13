"""MongoDB access with lazy, injectable clients for application and test use."""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING, MongoClient

from models.mongodb_models import ScanRecord, User, Repository, PullRequest, Notification, UserSettings


client = None
db = None
_database_name = "code_review_assistant"


def init_mongo(
    uri: Optional[str] = None,
    *,
    mongo_client=None,
    database_name: str = "code_review_assistant",
):
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
    db.users.create_index("github_id", unique=True, sparse=True)
    db.scans.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    db.scans.create_index("request_id", unique=True)
    db.repositories.create_index([("user_id", ASCENDING), ("github_id", ASCENDING)], unique=True)
    db.repositories.create_index("user_id")
    db.pull_requests.create_index([("repository_id", ASCENDING), ("number", ASCENDING)])
    db.pull_requests.create_index("user_id")
    db.notifications.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    db.notifications.create_index([("user_id", ASCENDING), ("read", ASCENDING)])
    db.user_settings.create_index("user_id", unique=True)
    return db


def reset_mongo() -> None:
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

    def create_user(self, username: str, email: str, password_hash: str, **kwargs) -> User:
        user_doc = {
            "username": username, "email": email, "password_hash": password_hash,
            "created_at": datetime.utcnow(), "last_login": None, "is_active": True,
            **kwargs
        }
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

    def get_user_by_github_id(self, github_id: int) -> Optional[User]:
        doc = self.collection.find_one({"github_id": github_id})
        return User(**doc) if doc else None

    def update_user(self, user_id: str, updates: Dict[str, Any]) -> None:
        self.collection.update_one({"_id": _object_id(user_id)}, {"$set": updates})

    def update_last_login(self, user_id: str) -> None:
        self.collection.update_one({"_id": _object_id(user_id)}, {"$set": {"last_login": datetime.utcnow()}})

    def delete_user(self, user_id: str) -> None:
        oid = _object_id(user_id)
        self.collection.delete_one({"_id": oid})
        get_db().scans.delete_many({"user_id": oid})
        get_db().repositories.delete_many({"user_id": oid})
        get_db().pull_requests.delete_many({"user_id": oid})
        get_db().notifications.delete_many({"user_id": oid})
        get_db().user_settings.delete_many({"user_id": oid})


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
        by_type: Dict[str, int] = {}
        by_severity: Dict[str, int] = {}
        total_issues = 0
        for scan in scans:
            total_issues += scan.summary.total_issues
            risk = scan.summary.overall_risk
            risks[risk] = risks.get(risk, 0) + 1
            for k, v in (scan.summary.by_type or {}).items():
                by_type[k] = by_type.get(k, 0) + v
            for k, v in (scan.summary.by_severity or {}).items():
                by_severity[k] = by_severity.get(k, 0) + v
        return {
            "total_scans": len(scans), "total_issues": total_issues,
            "avg_issues": round(total_issues / len(scans), 1) if scans else 0,
            "risk_distribution": risks,
            "by_type": by_type,
            "by_severity": by_severity,
        }

    def count_user_scans(self, user_id: str) -> int:
        return self.collection.count_documents({"user_id": _object_id(user_id)})

    def get_issues_over_time(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        since = datetime.utcnow() - timedelta(days=days)
        pipeline = [
            {"$match": {"user_id": _object_id(user_id), "timestamp": {"$gte": since}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "total_issues": {"$sum": "$summary.total_issues"},
                "security": {"$sum": "$summary.by_type.security"},
                "code_smell": {"$sum": "$summary.by_type.code_smell"},
                "performance": {"$sum": "$summary.by_type.performance"},
                "best_practice": {"$sum": "$summary.by_type.best_practice"},
                "critical": {"$sum": "$summary.by_severity.critical"},
                "high": {"$sum": "$summary.by_severity.high"},
                "medium": {"$sum": "$summary.by_severity.medium"},
                "low": {"$sum": "$summary.by_severity.low"},
                "info": {"$sum": "$summary.by_severity.info"}
            }},
            {"$sort": {"_id": 1}}
        ]
        return list(self.collection.aggregate(pipeline))

    def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        stats = self.get_user_scan_stats(user_id)
        recent = self.get_user_scans(user_id, limit=1)
        return {
            **stats,
            "avg_issues_per_scan": stats["avg_issues"],
            "last_scan": recent[0].model_dump(by_alias=True, mode="json") if recent else None
        }


class RepositoryService:
    @property
    def collection(self):
        return get_db().repositories

    def create_or_update(self, repo: Repository) -> Repository:
        existing = self.collection.find_one({
            "user_id": repo.user_id,
            "github_id": repo.github_id
        })
        if existing:
            updates = repo.model_dump(exclude={"id", "user_id", "github_id"})
            self.collection.update_one({"_id": existing["_id"]}, {"$set": updates})
            repo.id = existing["_id"]
            return repo
        repo_dict = repo.model_dump(by_alias=True, exclude={"id"})
        result = self.collection.insert_one(repo_dict)
        repo.id = result.inserted_id
        return repo

    def get_user_repos(self, user_id: str) -> List[Repository]:
        cursor = self.collection.find({"user_id": _object_id(user_id)}).sort("connected_at", DESCENDING)
        return [Repository(**doc) for doc in cursor]

    def get_repo_by_github_id(self, user_id: str, github_id: int) -> Optional[Repository]:
        doc = self.collection.find_one({"user_id": _object_id(user_id), "github_id": github_id})
        return Repository(**doc) if doc else None

    def get_repo_by_id(self, repo_id: str) -> Optional[Repository]:
        doc = self.collection.find_one({"_id": _object_id(repo_id)})
        return Repository(**doc) if doc else None

    def delete_repo(self, repo_id: str) -> None:
        oid = _object_id(repo_id)
        self.collection.delete_one({"_id": oid})
        get_db().pull_requests.delete_many({"repository_id": oid})

    def update_last_analyzed(self, repo_id: str) -> None:
        self.collection.update_one(
            {"_id": _object_id(repo_id)},
            {"$set": {"last_analyzed": datetime.utcnow()}}
        )


class PullRequestService:
    @property
    def collection(self):
        return get_db().pull_requests

    def create_or_update(self, pr: PullRequest) -> PullRequest:
        existing = self.collection.find_one({
            "repository_id": pr.repository_id,
            "number": pr.number
        })
        if existing:
            updates = pr.model_dump(exclude={"id", "repository_id", "number"})
            self.collection.update_one({"_id": existing["_id"]}, {"$set": updates})
            pr.id = existing["_id"]
            return pr
        pr_dict = pr.model_dump(by_alias=True, exclude={"id"})
        result = self.collection.insert_one(pr_dict)
        pr.id = result.inserted_id
        return pr

    def get_repo_prs(self, repository_id: str, limit: int = 50) -> List[PullRequest]:
        cursor = self.collection.find({"repository_id": _object_id(repository_id)}).sort("created_at", DESCENDING).limit(limit)
        return [PullRequest(**doc) for doc in cursor]

    def get_user_prs(self, user_id: str, limit: int = 50) -> List[PullRequest]:
        cursor = self.collection.find({"user_id": _object_id(user_id)}).sort("created_at", DESCENDING).limit(limit)
        return [PullRequest(**doc) for doc in cursor]

    def get_pr_by_number(self, repository_id: str, number: int) -> Optional[PullRequest]:
        doc = self.collection.find_one({"repository_id": _object_id(repository_id), "number": number})
        return PullRequest(**doc) if doc else None

    def update_analysis_status(self, repository_id: str, number: int, status: str) -> None:
        self.collection.update_one(
            {"repository_id": _object_id(repository_id), "number": number},
            {"$set": {"analysis_status": status, "analyzed_at": datetime.utcnow()}}
        )


class NotificationService:
    @property
    def collection(self):
        return get_db().notifications

    def create_notification(self, notification: Notification) -> Notification:
        notif_dict = notification.model_dump(by_alias=True, exclude={"id"})
        result = self.collection.insert_one(notif_dict)
        notification.id = result.inserted_id
        return notification

    def get_user_notifications(self, user_id: str, limit: int = 50, unread_only: bool = False) -> List[Notification]:
        query: Dict[str, Any] = {"user_id": _object_id(user_id)}
        if unread_only:
            query["read"] = False
        cursor = self.collection.find(query).sort("created_at", DESCENDING).limit(limit)
        return [Notification(**doc) for doc in cursor]

    def get_unread_count(self, user_id: str) -> int:
        return self.collection.count_documents({"user_id": _object_id(user_id), "read": False})

    def mark_read(self, user_id: str, notification_id: str) -> bool:
        result = self.collection.update_one(
            {"_id": _object_id(notification_id), "user_id": _object_id(user_id)},
            {"$set": {"read": True}}
        )
        return result.modified_count > 0

    def mark_all_read(self, user_id: str) -> int:
        result = self.collection.update_many(
            {"user_id": _object_id(user_id), "read": False},
            {"$set": {"read": True}}
        )
        return result.modified_count

    def delete_notification(self, user_id: str, notification_id: str) -> bool:
        result = self.collection.delete_one(
            {"_id": _object_id(notification_id), "user_id": _object_id(user_id)}
        )
        return result.deleted_count > 0

    def delete_all(self, user_id: str) -> int:
        result = self.collection.delete_many({"user_id": _object_id(user_id)})
        return result.deleted_count


class SettingsService:
    @property
    def collection(self):
        return get_db().user_settings

    def get_settings(self, user_id: str) -> UserSettings:
        doc = self.collection.find_one({"user_id": _object_id(user_id)})
        if doc:
            return UserSettings(**doc)
        settings = UserSettings(user_id=_object_id(user_id))
        settings_dict = settings.model_dump(by_alias=True, exclude={"id"})
        result = self.collection.insert_one(settings_dict)
        settings.id = result.inserted_id
        return settings

    def update_settings(self, user_id: str, updates: Dict[str, Any]) -> UserSettings:
        updates["updated_at"] = datetime.utcnow()
        self.collection.update_one(
            {"user_id": _object_id(user_id)},
            {"$set": updates},
            upsert=True
        )
        return self.get_settings(user_id)


user_service = UserService()
scan_service = ScanService()
repo_service = RepositoryService()
pr_service = PullRequestService()
notification_service = NotificationService()
settings_service = SettingsService()
