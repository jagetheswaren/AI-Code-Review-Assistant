# API Documentation

## Overview

The AI Code Review Assistant API provides endpoints for user authentication, code analysis, history management, and dashboard statistics.

**Base URL:** `https://your-backend.onrender.com/api` (production) or `http://localhost:5000/api` (development)

**Authentication:** All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer {token}
```

---

## Authentication Endpoints

### Register a New User
**POST** `/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "john_dev",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_dev",
    "email": "john@example.com"
  }
}
```

**Errors:**
- `400`: Missing or invalid fields
- `409`: Email or username already registered

---

### Login
**POST** `/login`

Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_dev",
    "email": "john@example.com"
  }
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials

---

### Get Current User
**GET** `/me`

Retrieve authenticated user information.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "john_dev",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `401`: Missing or invalid token
- `404`: User not found

---

### Refresh Token
**POST** `/refresh`

Get a new access token using current authentication.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Code Analysis Endpoints

### Analyze Code
**POST** `/analyze`

Analyze Python code for security issues, code smells, and performance problems.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "import os\npassword = 'admin123'\n...",
  "filename": "app.py",
  "github_pr_url": "https://github.com/user/repo/pull/123",
  "github_pr_number": 123,
  "github_repo": "user/repo"
}
```

**Response (200 OK):**
```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_analyses": [
    {
      "file_path": "app.py",
      "language": "python",
      "lines_of_code": 42,
      "issues": [
        {
          "type": "security",
          "severity": "critical",
          "line_number": 2,
          "column": 1,
          "message": "Hardcoded password detected",
          "rule_id": "B105",
          "suggestion": "Use environment variables instead",
          "code_snippet": "password = 'admin123'",
          "explanation": "Hardcoded credentials are a critical security risk...",
          "fix_suggestion": "password = os.environ.get('PASSWORD')",
          "ml_severity": "critical",
          "ml_confidence": 0.95
        }
      ]
    }
  ],
  "summary": {
    "total_issues": 5,
    "by_type": {
      "security": 2,
      "code_smell": 2,
      "performance": 1
    },
    "by_severity": {
      "critical": 1,
      "high": 2,
      "medium": 2
    },
    "overall_risk": "high",
    "file_path": "app.py"
  },
  "ai_review": "This code has several issues. The most critical is the hardcoded password...",
  "processing_time_ms": 1234
}
```

**Errors:**
- `400`: Missing or empty code
- `401`: Missing or invalid token
- `500`: Analysis failed

---

### Analyze File Upload
**POST** `/analyze/file`

Upload and analyze a Python file.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (multipart form):**
- `file`: Python file (.py)

**Response:** Same as `/analyze`

**Errors:**
- `400`: No file uploaded or invalid format
- `401`: Missing or invalid token

---

### GitHub Webhook
**POST** `/webhook/github`

Receive GitHub webhook events for automatic PR analysis.

**Headers:**
```
X-Hub-Signature-256: sha256=hexdigest
X-GitHub-Event: pull_request
```

**Request Body:** GitHub webhook payload for pull_request event

**Response (200 OK):**
```json
{
  "message": "Review completed",
  "files_reviewed": 3
}
```

**Notes:**
- This endpoint verifies GitHub webhook signatures
- Automatically posts review comments on the PR
- No authentication required (signature-based)

---

## Dashboard & Statistics Endpoints

### Get Dashboard
**GET** `/dashboard`

Retrieve user dashboard with statistics and recent scans.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "statistics": {
    "total_scans": 45,
    "total_issues": 234,
    "avg_issues_per_scan": 5.2,
    "risk_distribution": {
      "critical": 2,
      "high": 8,
      "medium": 15,
      "low": 20
    },
    "last_scan": {
      "request_id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2024-01-20T15:30:00Z",
      "summary": {
        "total_issues": 5,
        "overall_risk": "high"
      }
    }
  },
  "recent_scans": [
    {
      "request_id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2024-01-20T15:30:00Z",
      "summary": {
        "total_issues": 5,
        "overall_risk": "high",
        "by_severity": {
          "critical": 1,
          "high": 2,
          "medium": 2
        }
      }
    }
  ],
  "timestamp": "1234567890"
}
```

---

### Get Statistics
**GET** `/statistics`

Get user's overall statistics.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "total_scans": 45,
  "total_issues": 234,
  "avg_issues_per_scan": 5.2,
  "risk_distribution": {
    "critical": 2,
    "high": 8,
    "medium": 15,
    "low": 20
  },
  "last_scan": {...}
}
```

---

## History Endpoints

### Get History
**GET** `/history?page=1&per_page=20`

Get paginated list of user's code analysis scans.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20)

**Response (200 OK):**
```json
[
  {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-20T15:30:00Z",
    "summary": {
      "total_issues": 5,
      "overall_risk": "high",
      "file_path": "app.py"
    }
  }
]
```

---

### Get Scan Detail
**GET** `/history/{scanId}`

Retrieve detailed information about a specific scan.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-20T15:30:00Z",
  "file_analyses": [...],
  "summary": {...},
  "ai_review": "...",
  "processing_time_ms": 1234
}
```

**Errors:**
- `401`: Missing or invalid token
- `403`: Scan belongs to another user
- `404`: Scan not found

---

### Get Report
**GET** `/report/{request_id}`

Get report for a specific analysis request.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** Same as `GET /history/{scanId}`

---

## Health & Status Endpoints

### Health Check
**GET** `/health`

Check if the service is running.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "code-review-assistant"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created (registration)
- `400`: Bad request (invalid input)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `409`: Conflict (duplicate email/username)
- `500`: Internal server error

---

## Rate Limiting

Currently no rate limiting is implemented. Production deployment should include:
- 100 requests per minute per user
- 10 analysis requests per minute per user
- 1000 requests per hour per IP address

---

## Webhook Security

GitHub webhooks are verified using HMAC-SHA256 signatures:

```python
import hmac
import hashlib

def verify_webhook(payload_body, signature_header, secret):
    expected = hmac.new(
        secret.encode(),
        payload_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature_header)
```

---

## Examples

### cURL - Register and Login

```bash
# Register
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_dev",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### cURL - Analyze Code

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "password = '\''admin123'\''\n",
    "filename": "app.py"
  }'
```

### Python - Analyze Code

```python
import requests

TOKEN = "your_jwt_token"
API_URL = "http://localhost:5000/api"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

code = '''
import os
password = 'admin123'
db.connect(password)
'''

response = requests.post(
    f"{API_URL}/analyze",
    headers=headers,
    json={"code": code, "filename": "app.py"}
)

print(response.json())
```

### JavaScript - Analyze Code

```javascript
const token = localStorage.getItem('token');
const apiUrl = 'http://localhost:5000/api';

async function analyzeCode(code) {
  const response = await fetch(`${apiUrl}/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: code,
      filename: 'app.py'
    })
  });

  return await response.json();
}
```

---

## Support

For issues or questions, please open an issue on GitHub or contact support@example.com
