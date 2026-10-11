# IntelliReview AI V2 — Project Audit & Repository Baseline

**Audit Date:** 2026-10-09  
**Branch:** `feature/intellireview-v2`  
**Host Environment:** Windows (PowerShell) / Python 3.14.2 / Node.js & npm  
**Auditor:** Principal Software Architect & Antigravity Autonomous Team  

---

## 1. Executive Summary

An exhaustive repository inspection was performed on `jagetheswaren/AI-Code-Review-Assistant`. The project is an enterprise-oriented automated code review and GitHub pull request analysis platform built on **React 19**, **Flask 3**, **MongoDB**, **Bandit/Pylint/Radon/AST**, **Scikit-learn**, and multi-provider AI integrations (**Ollama** / **Groq**).

The codebase possesses substantial functional depth, including genuine static analysis, an AST-based vulnerability detector, a trained 3-version Random Forest ML severity classifier, GitHub REST & Webhook handlers with HMAC-SHA256 signature verification, and MongoDB persistence.

---

## 2. Technology Stack & Manifest Audit

### 2.1 Frontend
- **Framework & Runtime:** React 19 (`19.2.8`), React DOM (`19.2.8`)
- **Build System:** Create React App (`react-scripts 5.0.1`)
- **Styling:** Tailwind CSS (`3.4.19`), PostCSS (`8.5.23`), Custom "Obsidian Signal" dark palette
- **Editor:** `@monaco-editor/react` (`^4.7.0`)
- **Animation & Motion:** `framer-motion` (`^12.42.2`), `motion` (`^14.0.0`), GSAP (`^3.15.0`), ReactBits custom components
- **Routing:** `react-router-dom` (`^6.30.4`)
- **State & Data Fetching:** `@tanstack/react-query` (`^5.101.4`), `axios` (`^1.18.1`)
- **Forms & Validation:** `react-hook-form` (`^7.83.0`), `zod` (`^4.4.3`), `@hookform/resolvers`
- **Charts & Visualization:** `chart.js` (`^4.5.1`), `react-chartjs-2` (`^5.3.1`)
- **Icons:** `lucide-react` (`^1.27.0`)
- **Testing:** Playwright (`^1.63.0`), `@testing-library/react` (`^16.3.2`), Jest

### 2.2 Backend
- **Framework:** Flask (`3.1.3`), Werkzeug (`3.1.8`), ProxyFix
- **CORS & Middleware:** `flask-cors` (`6.0.5`), custom rate limiting (`middleware/security.py`)
- **Configuration & Validation:** `pydantic` (`2.13.4`), `pydantic-settings` (`2.14.2`), `python-dotenv` (`1.2.2`)
- **Authentication:** `PyJWT` (`2.13.0`), `bcrypt` (`5.0.0`), session state
- **Database Client:** `pymongo` (`4.17.0`), `mongomock` (`4.3.0` for isolated tests)
- **Production Server:** `gunicorn` (`26.2.0`)
- **Export Engines:** `reportlab` (`5.0.0`), CSV, JSON

### 2.3 Static Analysis Engines
- **Security:** `bandit` (`1.9.4`), Custom Python `ast` visitor
- **Quality & Smells:** `pylint` (`4.0.6`), `astroid` (`4.0.4`)
- **Complexity & Metrics:** `radon` (`6.0.1`)
- **Aggregator:** Custom `FindingAggregator` merging AST, Bandit, Pylint, and Radon findings while eliminating duplicates

### 2.4 Machine Learning & AI
- **ML Classifier:** `scikit-learn` (`1.9.0`), `joblib` (`1.5.3`), `numpy` (`2.5.1`)
  - Serialized models present: `backend/ml/models/severity_classifier_v1.joblib`, `v2.joblib`, `v3.joblib`
  - Synthetic training generator and evaluation script (`backend/ml/evaluate_model.py`)
  - Target leakage prevention in feature extraction v2
- **AI Integrations:**
  - `ollama` (`0.6.2`) for local LLMs (`qwen2.5-coder:7b`)
  - `groq` (`1.7.0`) for cloud LLM inference (`openai/gpt-oss-120b` or `llama-3.3-70b-versatile`)
  - Structured JSON parsing with regex & delimiter sanitization
  - Graceful fallback to static analysis when AI providers are unavailable

### 2.5 Database
- **Active Instance:** MongoDB 9.0.2 running locally as a Windows service on `localhost:27017`
- **Database Name:** `code_review_assistant`
- **Existing Collections:**
  - `users`: 9 documents
  - `scans`: 8 documents
  - `user_settings`: 3 documents
  - `repositories`: 0 documents
  - `pull_requests`: 0 documents
  - `notifications`: 0 documents

---

## 3. Baseline Verification Results

| Check | Tool / Command | Result | Notes |
|---|---|---|---|
| **Backend Unit & Integration Tests** | `pytest -v` | **100 PASSED, 1 SKIPPED, 0 FAILED** | All analyzers, API endpoints, ML pipeline, and GitHub webhook tests pass |
| **Frontend Test Suite** | `npm run test:ci` | **5 PASSED, 0 FAILED** | 2 test suites passed cleanly |
| **Frontend Production Build** | `npm run build` | **SUCCESS** | Output: 412.54 kB main JS, 14.39 kB CSS. Unused import warnings detected |
| **MongoDB Connectivity** | Python pymongo ping | **SUCCESS** | MongoDB 9.0.2 responsive on localhost:27017 |
| **Ollama Local Service** | Port 11434 check | **OFFLINE** | Fallback to static analysis verified working |

---

## 4. Key Gaps, Issues, and Technical Debt Identified

1. **Forced Login on Instant Review (Journey A Violation):**
   - In `frontend/src/pages/Landing.jsx`, the "Start Reviewing" and "Start Live Review" buttons invoke `openAuthModal('/review')`, forcing authentication before entering the workspace.
   - In `frontend/src/App.jsx`, `/review` was protected by `<ProtectedRoute>`, redirecting guests back to `/`.
   - In `backend/api/review_routes.py`, `/api/analyze` and `/api/analyze/file` were guarded with `@token_required`, returning HTTP 401 for unauthenticated instant reviews.
   - **Remediation:** Support optional token authentication for `/api/analyze`. Allow guests to review code immediately; prompt login only when saving scans to history or accessing user-scoped features.

2. **Playwright E2E Selector Drift:**
   - Existing Playwright specs in `frontend/tests/e2e/` search for legacy selectors (`[data-testid="code-editor"]`, `[data-testid="run-review"]`, `[data-testid="nav-login"]`) that were renamed or omitted in recent UI iterations.
   - **Remediation:** Standardize data-testid attributes across `Review.jsx`, `Landing.jsx`, `Navbar.jsx`, and `History.jsx`.

3. **Frontend Build Warnings:**
   - 28 unused variable warnings in `Landing.jsx`, `Review.jsx`, `PullRequest.jsx`, `Reports.jsx`, `Settings.jsx`, `Dashboard.jsx`.
   - **Remediation:** Clean up unused imports and satisfy React Hook dependency arrays.

4. **Multi-Language Analysis Scope:**
   - Currently, the static analyzers fully execute on Python (`.py`). Other languages (JS/TS, Java, C/C++) require clear labeling of capabilities: syntax validation, AI-guided review, and explicit analyzer declarations without simulated static analysis.

5. **Secrets and Credential Hygiene:**
   - Baseline inspection revealed dummy placeholders in `.env.example` and `.env` (`ghp_xxxxxxxxxxxxxxxxxxxx`, `your-webhook-secret-here`).
   - No live production tokens or secrets are committed to Git.
   - `.env` files are properly ignored in `.gitignore`.

---

## 5. Dependency Map

```
[React 19 Frontend (Port 3000)]
       │
       ▼ (Axios + TanStack Query /api)
[Flask REST API (Port 5000)]
  ├── Auth Blueprint (JWT, bcrypt) ────► MongoDB (users, settings)
  ├── Review Blueprint
  │     ├── AnalysisService
  │     │     ├── SecurityAnalyzer (Bandit, AST)
  │     │     ├── SmellAnalyzer (Pylint, Astroid)
  │     │     ├── ComplexityAnalyzer (Radon)
  │     │     ├── FindingAggregator (Deduplication)
  │     │     ├── SeverityClassifier (Scikit-learn RF v3)
  │     │     └── AIReviewer (Ollama / Groq / Fallback)
  │     └── ScanService ───────────────► MongoDB (scans collection)
  ├── GitHub Blueprint
  │     ├── GitHubClient ──────────────► GitHub REST API v3
  │     ├── WebhookHandler ────────────► HMAC-SHA256 Verification
  │     └── PR Analysis Worker ────────► GitHub PR Comments & MongoDB
  └── Export Blueprint (ReportLab) ────► PDF, CSV, JSON streams
```

---

## 6. Audit Conclusion

The repository is healthy, modular, and ready for systematic V2 upgrade execution. All baseline tests pass, MongoDB is online, and the production build compiles. We proceed to Phase 1 & 2 (Frontend Foundation & Pages), Phase 3 (Backend API Stabilization), and beyond.
