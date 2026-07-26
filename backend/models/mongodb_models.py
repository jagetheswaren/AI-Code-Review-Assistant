from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from bson import ObjectId
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ])
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


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
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
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


class FileAnalysis(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    file_path: str
    language: str = "python"
    lines_of_code: int = 0
    issues: List[Issue] = []


class AnalysisSummary(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    total_issues: int = 0
    by_type: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    overall_risk: str = "none"
    file_path: str = ""


class ScanRecord(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: Optional[PyObjectId] = None
    request_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    file_analyses: List[FileAnalysis] = []
    summary: AnalysisSummary = AnalysisSummary()
    ai_review: Optional[str] = None
    github_pr_url: Optional[str] = None
    github_pr_number: Optional[int] = None
    github_repo: Optional[str] = None
    github_comment_url: Optional[str] = None
    processing_time_ms: int = 0


class User(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
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