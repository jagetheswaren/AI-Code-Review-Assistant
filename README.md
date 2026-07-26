<p align="center">
  <img src="logo.svg" alt="AI Code Review Assistant" width="600">
</p>

<p align="center">
  <a href="https://ai-code-review-assistant.vercel.app"><strong>Live Demo</strong></a> &nbsp;&bull;&nbsp;
  <a href="https://github.com/jagetheswaren/AI-Code-Review-Assistant"><strong>GitHub</strong></a>
</p>

<p align="center">
  <img src="https://github.com/jagetheswaren/AI-Code-Review-Assistant/actions/workflows/ci.yml/badge.svg" alt="CI">
  <img src="https://img.shields.io/badge/python-3.11+-blue.svg" alt="Python 3.11+">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
</p>

---

AI-powered code review tool that performs static analysis on Python code and provides AI-generated explanations and fix suggestions.

## Features

- **Security Analysis** (Bandit + custom AST): Detects SQL injection, XSS, hardcoded secrets, shell injection, unsafe deserialization, and more
- **Code Smell Detection** (astroid + custom): Unused imports/variables, long functions, complex conditionals, magic numbers, naming conventions, dead code, too many arguments, duplicate code, trailing whitespace, missing docstrings, deep nesting, bare except clauses
- **Complexity Analysis** (Radon): Cyclomatic complexity, maintainability index, Halstead metrics, lines of code
- **AI Explanations** (Ollama + qwen2.5-coder): Plain English explanations and fix suggestions
- **GitHub Integration**: Webhook handler for PR reviews, posts results as PR comments
- **REST API**: `/api/analyze` for code analysis, `/api/analyze/file` for file uploads
- **Summary Dashboard**: Overall risk level, issue counts by type and severity

## Architecture

```
backend/
├── analyzers/
│   ├── security_analyzer.py    # Bandit + custom AST security checks
│   ├── smell_analyzer.py       # Pylint/astroid code smell detection
│   └── complexity_analyzer.py  # Radon complexity metrics
├── reviewer/
│   ├── ai_reviewer.py          # Ollama integration for AI explanations
│   ├── aggregator.py           # Merge and deduplicate findings
│   └── github_commenter.py     # Format GitHub PR comments
├── api/
│   └── review_routes.py        # Flask REST endpoints
├── models/
│   └── review.py               # Pydantic data models
├── services/
│   └── github_client.py        # GitHub REST API client
├── config.py                   # Configuration (pydantic-settings)
└── app.py                      # Flask entry point
```

## Quick Start

### Prerequisites

- Python 3.10+
- Ollama running locally with `qwen2.5-coder:3b` model
- GitHub Personal Access Token (for webhook integration)

### Installation

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

# Install Ollama model
ollama pull qwen2.5-coder:3b
```

### Configuration

Copy `.env.example` to `.env` and fill in:

```env
FLASK_ENV=development
FLASK_PORT=5000
CORS_ORIGINS=http://localhost:3000
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_WEBHOOK_SECRET=your_webhook_secret
OLLAMA_MODEL=qwen2.5-coder:3b
OLLAMA_BASE_URL=http://localhost:11434
```

### Run Server

```bash
cd backend
venv\Scripts\python -m app
```

Server runs at `http://localhost:5000`

## API Usage

### Analyze Code

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import os\nos.system(\"ls \" + user_input)",
    "filename": "example.py"
  }'
```

### Upload File

```bash
curl -X POST http://localhost:5000/api/analyze/file \
  -F "file=@example.py"
```

### Response Format

```json
{
  "request_id": "uuid",
  "file_analyses": [{
    "file_path": "example.py",
    "language": "python",
    "lines_of_code": 10,
    "issues": [
      {
        "type": "security",
        "severity": "critical",
        "line_number": 2,
        "message": "Shell command injection vulnerability",
        "rule_id": "SECURITY_OS_SYSTEM",
        "suggestion": "Use subprocess.run() with shell=False",
        "code_snippet": "2: os.system(\"ls \" + user_input)"
      }
    ]
  }],
  "summary": {
    "total_issues": 3,
    "by_type": {"security": 2, "code_smell": 1, "performance": 0},
    "by_severity": {"critical": 1, "high": 1, "medium": 0, "low": 1, "info": 0},
    "overall_risk": "high",
    "file_path": "example.py"
  },
  "ai_review": "AI-generated explanation...",
  "processing_time_ms": 245
}
```

## Complexity Scoring (Radon)

| Cyclomatic Complexity | Rank | Severity | Action |
|----------------------|------|----------|--------|
| 1-5 | A | Low | Monitor |
| 6-10 | B | Low | Monitor |
| 11-20 | C | Medium | Consider refactoring |
| 21-30 | D | Medium | Refactor recommended |
| 31-40 | E | High | Refactor required |
| 40+ | F | Critical | Immediate refactor |

| Maintainability Index | Rank | Severity |
|----------------------|------|----------|
| >85 | A | Low |
| 70-85 | B | Low |
| 50-70 | C | Medium |
| 25-50 | D | High |
| <25 | E/F | Critical |

## GitHub Webhook Setup

1. Create a GitHub App or use a Personal Access Token with `repo` scope
2. Set webhook URL: `https://your-domain/api/webhook/github`
3. Select events: `Pull request`
4. Set secret in `.env`: `GITHUB_WEBHOOK_SECRET`

The webhook will:
- Trigger on PR opened/synchronize/reopened
- Analyze all `.py` files in the PR
- Post summary comment on PR
- Add inline comments for critical/high issues

## Example Output

### Security Issue
```json
{
  "type": "security",
  "tool": "Bandit",
  "rule": "B602",
  "severity": "critical",
  "line_number": 14,
  "raw_issue": "shell injection",
  "message": "Starting a process with shell=True"
}
```

### Code Smell
```json
{
  "type": "smell",
  "tool": "Pylint",
  "rule": "C0114",
  "severity": "low",
  "line_number": 5,
  "raw_issue": "Missing module docstring"
}
```

### Complexity Issue
```json
{
  "type": "complexity",
  "tool": "Radon",
  "rule": "CC",
  "severity": "high",
  "line_number": 40,
  "raw_issue": "Cyclomatic Complexity = 17"
}
```

## Project Structure

```
AI-Code-Review-Assistant/
├── backend/
│   ├── analyzers/
│   │   ├── security_analyzer.py
│   │   ├── smell_analyzer.py
│   │   └── complexity_analyzer.py
│   ├── reviewer/
│   │   ├── ai_reviewer.py
│   │   ├── aggregator.py
│   │   └── github_commenter.py
│   ├── api/
│   │   ├── review_routes.py
│   │   └── auth_routes.py
│   ├── models/
│   │   ├── review.py
│   │   └── mongodb_models.py
│   ├── services/
│   │   └── github_client.py
│   ├── database/
│   │   └── mongodb.py
│   ├── auth/
│   │   └── jwt_auth.py
│   ├── tests/
│   │   ├── test_analyzers.py
│   │   ├── test_api_endpoints.py
│   │   └── test_e2e.py
│   ├── config.py
│   ├── app.py
│   ├── gunicorn.conf.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/               # React dashboard with Chart.js
│   ├── src/
│   ├── vercel.json
│   └── package.json
├── ml/                     # ML models (scikit-learn, sentence-transformers)
├── docs/
├── docker-compose.yml
├── render.yaml
└── README.md
```

## Development

### Running Tests

```bash
cd backend
venv\Scripts\python -m pytest tests/
```

### Adding New Security Rules

Edit `security_analyzer.py` - add to `_check_dangerous_calls` or `_check_hardcoded_secrets`

### Adding New Code Smells

Edit `smell_analyzer.py` - add new `_check_*` method and call in `analyze()`

## Roadmap

- **Phase 1** ✅: Core analyzers (Bandit, Pylint, Radon) + Flask API
- **Phase 2** ✅: ML severity classifier (scikit-learn) + NLP explanations (Ollama + qwen2.5-coder)
- **Phase 3** ✅: MongoDB persistence + JWT auth + React dashboard (Chart.js)
- **Phase 4** ✅: GitHub webhook + PR comments + Vercel/Render deployment

## License

MIT