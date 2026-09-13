from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class IssueType(str, Enum):
    SECURITY = "security"
    CODE_SMELL = "code_smell"
    PERFORMANCE = "performance"
    BEST_PRACTICE = "best_practice"


class Issue(BaseModel):
    type: IssueType
    severity: Severity
    line_number: int
    column: Optional[int] = None
    message: str
    rule_id: Optional[str] = None
    suggestion: Optional[str] = None
    code_snippet: Optional[str] = None
    file_path: Optional[str] = None
    explanation: Optional[str] = None
    fix_suggestion: Optional[str] = None
    ml_severity: Optional[str] = None
    ml_confidence: Optional[float] = None
    ml_model_version: Optional[str] = None
    source: List[str] = Field(default_factory=list)


class FileAnalysis(BaseModel):
    file_path: str
    language: str = "python"
    lines_of_code: int = 0
    issues: List[Issue] = []


class AnalysisSummary(BaseModel):
    total_issues: int = 0
    by_type: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    overall_risk: str = "none"
    file_path: str = ""


class ReviewRequest(BaseModel):
    file_path: str
    code: str
    language: str = "python"
    github_pr_url: Optional[str] = None
    github_pr_number: Optional[int] = None
    github_repo: Optional[str] = None


class ReviewResponse(BaseModel):
    request_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    file_analyses: List[FileAnalysis] = []
    summary: AnalysisSummary = AnalysisSummary()
    ai_review: Optional[str] = None
    github_comment_url: Optional[str] = None
    processing_time_ms: int = 0


class GitHubWebhookPayload(BaseModel):
    action: str
    number: int
    pull_request: dict
    repository: dict


class GitHubCommentRequest(BaseModel):
    owner: str
    repo: str
    pr_number: int
    body: str


class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ScanRecord(BaseModel):
    """Record of a code analysis scan"""
    id: Optional[str] = None
    user_id: str
    scan_type: str = "manual"  # manual, webhook, scheduled
    file_path: str
    code: str
    language: str = "python"
    status: str = "completed"  # pending, processing, completed, failed
    file_analyses: List[FileAnalysis] = []
    summary: Optional[AnalysisSummary] = None
    ai_review: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    processing_time_ms: int = 0
    github_pr_url: Optional[str] = None
    github_pr_number: Optional[int] = None
    github_repo: Optional[str] = None