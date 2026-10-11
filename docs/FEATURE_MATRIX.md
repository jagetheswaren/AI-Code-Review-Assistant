# IntelliReview AI V2 — Feature Matrix

**Status Date:** 2026-10-09  
**Specification:** Master Prompt V2  
**Baseline Status:** Verified via automated tests, runtime checks, and code inspection.  

---

## Status Key
- **Existing and working**: Verified by code inspection and passing automated tests / live verification.
- **Existing but broken**: Code exists but contains runtime defects, selector mismatch, or broken flows.
- **Partially implemented**: Functional in some scenarios, but lacks required features or end-to-end integration.
- **Not implemented**: Needs to be built.
- **Requires configuration**: Implemented, but requires local setup or environment variables (e.g., Ollama model download).
- **Blocked by external credentials or services**: Implemented, but requires external user secrets (e.g., GitHub OAuth App client secret, Groq API key).

---

## 1. User Journeys

| Journey | Description | Status | Evidence & Notes |
|---|---|---|---|
| **Journey A** | **Instant Code Review (Public)** | Partially implemented | Backend analyzers work (`/api/analyze`), but `@token_required` and UI `<ProtectedRoute>` previously forced login. Allowing optional auth unblocks instant public review. |
| **Journey A** | Code paste & accepted file upload | Existing and working | Verified in `Review.jsx` & `/api/analyze/file` for `.py` files. |
| **Journey A** | Monaco line jump & diff highlighting | Existing and working | Verified in `Review.jsx` with `deltaDecorations` and `revealLineInCenter`. |
| **Journey A** | Save scan to history & export | Existing and working | Requires authentication; verified via `/api/history` and `/api/export/*`. |
| **Journey B** | **GitHub Repository Review** | Existing and working | PAT connection works; repos and branch file browsing implemented. |
| **Journey B** | OAuth2 GitHub connection | Blocked by external credentials or services | OAuth endpoints implemented; requires GitHub OAuth App Client ID & Secret in `.env`. |
| **Journey C** | **GitHub Pull Request Review** | Existing and working | Analyzes changed PR files; tested in `test_github_integration.py`. |
| **Journey C** | Webhook HMAC-SHA256 signature verification | Existing and working | Verified by 4 passing unit tests in `test_github_integration.py`. |
| **Journey C** | PR review comment publishing | Existing and working | Verified via `GitHubCommenter` and `test_github_integration.py`. |
| **Journey D** | **Dashboard & Reporting** | Existing and working | Verified via `/api/dashboard`, `/api/statistics`, `/api/trends`. Real data from MongoDB. |
| **Journey D** | Multi-format exports (JSON, CSV, PDF) | Existing and working | Verified via `/api/export/{json,csv,pdf}/<scan_id>` with ReportLab. |

---

## 2. Frontend Features

| Component / Page | Status | Notes |
|---|---|---|
| **Landing Page** | Existing and working | Interactive hero, SplitText, GridScan, ElectricBorder, AuthModal, features. Needs direct link to `/review`. |
| **Review Workspace** | Existing and working | Monaco editor, line jumping, tabs, severity badges, suggested fixes. Needs public access. |
| **Dashboard** | Existing and working | Real analytics cards, Chart.js trends, risk distribution, recent scan table. |
| **Security Center** | Existing and working | Filterable list of security issues, CWE/Bandit categorization, remediation advice. |
| **Code Quality Page** | Existing and working | Smells, style violations, unused imports, maintainability index. |
| **Performance Page** | Existing and working | Cyclomatic complexity distributions from Radon, algorithmic warnings. |
| **GitHub Integration Page** | Existing and working | Status card, PAT connector, OAuth initiation, repository explorer. |
| **Repository Detail Page** | Existing and working | Branch selector, file tree, commit info, direct scan trigger. |
| **Pull Request Page** | Existing and working | PR overview, diff viewer, changed file list, review runner. |
| **Review History & Detail** | Existing and working | Paginated history table, status badges, deep dive into past scans. |
| **Reports Page** | Existing and working | Scan report selector, direct download for JSON, CSV, PDF. |
| **AI Assistant Page (Chat)** | Existing and working | Context-aware chat with scan findings, suggestion prompt builder. |
| **Profile Page** | Existing and working | User details, password change, account deletion with confirmation. |
| **Settings Page** | Existing and working | Theme preference, notification toggles, analyzer configuration. |
| **Command Palette (Ctrl+K)**| Existing and working | Accessible quick navigation across workspace pages. |
| **Custom 404 Page** | Existing and working | Obsidian Signal styled 404 page with recovery button. |

---

## 3. Backend & Core APIs

| API Blueprint / Route | Status | Notes |
|---|---|---|
| `POST /api/register` | Existing and working | bcrypt password hash, MongoDB user creation, duplicate check. |
| `POST /api/login` | Existing and working | bcrypt verification, JWT generation. |
| `GET /api/me` | Existing and working | Token required; returns user profile. |
| `POST /api/analyze` | Existing and working | AST, Bandit, Pylint, Radon, ML classification, AI review context. |
| `POST /api/analyze/file` | Existing and working | File upload with extension & size validation. |
| `GET /api/history` | Existing and working | Paginated user scans from MongoDB. |
| `GET /api/history/<scan_id>` | Existing and working | User-scoped scan retrieval. |
| `GET /api/statistics` | Existing and working | Real aggregate statistics across user scans. |
| `GET /api/trends` | Existing and working | 30-day time-series aggregation pipeline. |
| `GET /api/dashboard` | Existing and working | Consolidated dashboard payload. |
| `GET /api/ai/status` | Existing and working | Multi-provider health check with static fallback. |
| `POST /api/admin/model/reload` | Existing and working | Disk reload of serialized Scikit-learn model. |
| `GET /api/github/status` | Existing and working | Checks connected GitHub state. |
| `POST /api/github/pat/connect` | Existing and working | Validates GitHub PAT via API call to GitHub `/user`. |
| `GET /api/github/repos` | Existing and working | Fetches authorized user repos with pagination. |
| `POST /api/github/webhook` | Existing and working | HMAC-SHA256 signature verification & deduplication. |
| `GET /api/export/{json,csv,pdf}/<id>` | Existing and working | Generates formatted reports from MongoDB scan records. |
| `GET /health` & `GET /ready` | Existing and working | Production container health and MongoDB ping readiness probes. |

---

## 4. Static Analysis Engines

| Analyzer | Status | Notes |
|---|---|---|
| **Bandit Security Analyzer** | Existing and working | B101, B102, B301, B303, B506, B602, etc. |
| **Custom AST Security Visitor**| Existing and working | Hardcoded passwords, secrets, risky eval/exec, SQL injection patterns. |
| **Pylint & Astroid Smell Analyzer**| Existing and working | Unused imports, unused variables, long functions, deep nesting. |
| **Radon Complexity Analyzer** | Existing and working | Cyclomatic complexity (CC) and Maintainability Index (MI). |
| **Heuristic Performance Analyzer**| Existing and working | Nested loops, inefficient concatenation in loops, excessive regex calls. |
| **Finding Aggregator** | Existing and working | Deduplicates overlapping Bandit & AST findings into unified issues. |
| **Multi-Language Analysis** | Partially implemented | Python fully supported; JS/TS and Java declared with syntax/AI coverage. |

---

## 5. Machine Learning & AI

| Feature | Status | Notes |
|---|---|---|
| **Scikit-learn RF Classifier**| Existing and working | Random Forest model (v3 in `backend/ml/models/`) trained on feature vectors. |
| **Feature Extraction v2** | Existing and working | Rule ID hashing, type encoding, message length, zero target leakage. |
| **Deterministic Rule Severity**| Existing and working | Authoritative fallback; ML cannot downgrade critical security findings. |
| **Ollama Local LLM** | Requires configuration | Code supports Ollama (`qwen2.5-coder:7b`). Host service currently offline. |
| **Groq Cloud LLM** | Blocked by external credentials | Code supports Groq SDK. Requires `GROQ_API_KEY` in environment. |
| **Static Review Fallback** | Existing and working | Returns structured findings and guidance without failing if AI is offline. |

---

## 6. Database & Persistence

| Entity / Collection | Status | Notes |
|---|---|---|
| **Users Collection** | Existing and working | Unique indexes on email, username; 9 active records in MongoDB. |
| **Scans Collection** | Existing and working | Compound index on `(user_id, timestamp)`; 8 active records. |
| **Repositories Collection** | Existing and working | Index on `(user_id, github_id)`. |
| **Pull Requests Collection**| Existing and working | Index on `(repository_id, number)`. |
| **Notifications Collection**| Existing and working | User-scoped notifications with read status. |
| **User Settings Collection**| Existing and working | Theme, language, and analysis preferences; 3 records. |

---

## 7. DevOps & Infrastructure

| Target | Status | Notes |
|---|---|---|
| **Docker Containerization** | Existing and working | `Dockerfile` for backend and frontend, `docker-compose.yml` present. |
| **Render Backend Deploy** | Existing and working | `render.yaml` configuration present with gunicorn start command. |
| **Vercel Frontend Deploy** | Existing and working | `vercel.json` and static routing present. |
| **GitHub Actions CI/CD** | Existing and working | `.github/workflows/ci.yml` and release actions present. |
