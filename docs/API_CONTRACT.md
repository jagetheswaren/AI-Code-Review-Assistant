# IntelliReview AI: API Contract

This document outlines the standard data models and REST API contracts used between the frontend and the backend.

## Base URL
All API routes are prefixed with `/api`.
For example: `http://localhost:5000/api/analyze`

## Core Data Models

### 1. `Issue`
Represents a single vulnerability, smell, or suggestion in the code.
```json
{
  "type": "security | code_smell | performance | best_practice",
  "severity": "critical | high | medium | low | info",
  "line_number": 42,
  "column": null,
  "message": "Use of hardcoded password detected",
  "rule_id": "B105",
  "suggestion": "Use environment variables instead.",
  "code_snippet": "password = 'secret'",
  "file_path": "auth.py",
  "explanation": "Hardcoded passwords can be easily compromised...",
  "fix_suggestion": "password = os.getenv('DB_PASS')",
  "ml_severity": "high",
  "ml_confidence": 0.92,
  "source": ["bandit", "ml", "codebert"]
}
```

### 2. `FileAnalysis`
Groups issues by file.
```json
{
  "file_path": "auth.py",
  "language": "python",
  "lines_of_code": 150,
  "issues": [ { /* Issue Object */ } ]
}
```

### 3. `AnalysisSummary`
Provides an overview of the analysis.
```json
{
  "total_issues": 1,
  "by_type": { "security": 1 },
  "by_severity": { "high": 1 },
  "overall_risk": "high",
  "health_score": 95,
  "file_path": "auth.py"
}
```

### 4. `ReviewResponse`
The standard response from any code analysis endpoint (both `/api/analyze` and `/api/github/.../analyze`).
```json
{
  "request_id": "uuid-v4",
  "file_analyses": [ { /* FileAnalysis Object */ } ],
  "summary": { /* AnalysisSummary Object */ },
  "ai_review": "The code contains a hardcoded password...",
  "ai_available": true,
  "ai_error": null,
  "ai_model": "qwen2.5-coder",
  "ai_structured": {
    "issues": [],
    "recommendations": [],
    "raw": ""
  },
  "processing_time_ms": 1250
}
```

## Standardized Endpoints

### `POST /api/analyze`
Accepts raw code string or files for analysis.

**Request Body**
```json
{
  "code": "print('hello')",
  "filename": "main.py"
}
```

**Response**: `ReviewResponse` (200 OK)

### `POST /api/github/repos/:repo/pull-requests/:pr/analyze`
Triggers an analysis for a GitHub PR.

**Response**: `ReviewResponse` (200 OK)

### `GET /api/admin/model/reload`
Admin endpoint to reload the active ML classifier model and get AI status.

**Response** (200 OK)
```json
{
  "status": "success",
  "message": "Model reloaded successfully",
  "model_info": {
    "version": "v3",
    "features": "v2-no-leakage",
    "trained": true
  }
}
```

## Error Handling
The backend uses unified error reporting for predictable frontend handling.
```json
{
  "error": "Meaningful error message here",
  "details": "Optional stack trace or detail string"
}
```
HTTP status codes (400, 401, 403, 404, 429, 500) map directly to error severities in the UI.
