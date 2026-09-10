# Architecture and Code Audit: IntelliReview AI

## 1. Current Architecture

The codebase currently contains **two parallel architectures** side-by-side:
1. **The Legacy (Existing) Architecture:** Contains the fully-featured IntelliReview AI as described in the README. It uses React 19 + Tailwind CSS (frontend) and Flask + MongoDB (backend).
2. **The New (Migration) Architecture:** A partially implemented migration using Next.js (frontend) and FastAPI + PostgreSQL + Redis + Celery (backend). 

The legacy code has been moved to `frontend-legacy` and `backend-legacy`, while the root `docker-compose.yml` and the new `frontend`/`backend` directories represent the incomplete migration.

## 2. Current Directory Structure

```text
/
├── backend/                # [NEW] FastAPI + PostgreSQL + Redis (Partially Implemented)
├── backend-legacy/         # [EXISTING] Flask API, ML models, analyzers, GitHub integrations
├── frontend/               # [NEW] Next.js 16 + Tailwind CSS (Partially Implemented)
├── frontend-legacy/        # [EXISTING] React 19 + Tailwind CSS SPA
├── models/                 # Serialized ML Models (severity_classifier.joblib)
├── render.yaml             # Render deployment config (currently broken, points to `backend/`)
├── docker-compose.yml      # Local dev config (currently points to new `backend`/`frontend`)
└── README.md               # Documentation of the legacy architecture
```

## 3. Technology Inventory

| Component | Legacy (Implemented) | New (Partial/Planned) |
| :--- | :--- | :--- |
| **Frontend** | React 19.2.8, Tailwind 3.4 | Next.js 16.3.4, Tailwind 4.0 |
| **Backend** | Flask 3.0.3, Gunicorn | FastAPI 0.100.0, Uvicorn |
| **Database** | MongoDB (pymongo) | PostgreSQL, Redis, Celery |
| **ML/AI** | scikit-learn, transformers, ollama | - |
| **Analysis** | bandit, astroid, radon, pylint | - |

## 4. Frontend (Legacy)
- **Status:** **IMPLEMENTED AND WORKING**
- **Location:** `frontend-legacy/`
- **Tech:** React 19, Tailwind CSS, React Router, Axios, Chart.js.
- **Details:** Contains `pages/`, `components/`, `contexts/`, and `api/` directories. State management uses React Context. 
- **Deployment Config:** Contains `vercel.json` for Vercel deployment.

## 5. Backend (Legacy)
- **Status:** **IMPLEMENTED AND WORKING**
- **Location:** `backend-legacy/`
- **Tech:** Python, Flask, PyMongo, PyJWT.
- **Details:** 
  - Entry point: `app.py`
  - Routes: Modularized into `auth_routes`, `review_routes`, `github_routes`, `export_routes`, etc.
  - Authentication: JWT based (`auth/jwt_auth.py`).

## 6. Database
- **Status:** **IMPLEMENTED AND WORKING**
- **Tech:** MongoDB
- **Details:** Connection logic is in `backend-legacy/database/mongodb.py`. It uses `pymongo` and manages collections for users, scans, repositories, and settings.

## 7. Code Analysis Pipeline
- **Status:** **IMPLEMENTED AND WORKING**
- **Location:** `backend-legacy/analyzers/`
- **Pipeline Flow:** 
  1. Source code is ingested via `review_routes.py`.
  2. Routed to `security_analyzer.py` (uses `bandit` and `ast`).
  3. Routed to `smell_analyzer.py` (uses `astroid`, `pylint` logic).
  4. Routed to `complexity_analyzer.py` (uses `radon`).
  5. Routed to `performance_analyzer.py` (uses `ast`).
  6. Results passed to ML classifier and NLP explainer.

## 8. Machine Learning
- **Status:** **IMPLEMENTED AND WORKING**
- **Location:** `backend-legacy/ml/` and `models/`
- **Details:** 
  - Implementation in `severity_classifier.py` and `train_model.py`.
  - Serialized model `severity_classifier.joblib` (2.2MB) is present in the `models/` directory.
  - Uses `scikit-learn` and `numpy`.

## 9. AI and NLP
- **Status:** **IMPLEMENTED AND WORKING**
- **Location:** `backend-legacy/ai/` and `backend-legacy/ml/nlp_explainer.py`
- **Details:**
  - **Ollama:** `reviewer.py` uses the `ollama` python client with model `qwen2.5-coder:3b` for AI code reviews.
  - **CodeBERT:** `nlp_explainer.py` uses Hugging Face `transformers` pipeline with `microsoft/CodeGPT-small-py` to generate explanations and fixes. It has an explicit fallback dictionary if transformers are unavailable.

## 10. GitHub Integration
- **Status:** **IMPLEMENTED AND WORKING**
- **Location:** `backend-legacy/services/github_client.py` and `backend-legacy/api/github_routes.py`
- **Details:** Contains a complete API client handling OAuth token flows, PR retrieval, fetching file content, reading diffs, and posting review comments back to GitHub.

## 11. Reports
- **Status:** **IMPLEMENTED AND WORKING**
- **Location:** `backend-legacy/api/export_routes.py`
- **Details:** Endpoints exist for generating JSON, CSV (`csv` module), and PDF (using `reportlab`).

## 12. Deployment
- **Status:** **IMPLEMENTED BUT BROKEN (Config mismatch)**
- **Vercel:** `frontend-legacy/vercel.json` is properly configured.
- **Render:** `render.yaml` in the root points to `cd backend && gunicorn ... app:app`. However, the Flask app was moved to `backend-legacy/`. The new `backend/` directory uses FastAPI which will cause Render deployments to fail.
- **Docker Compose:** `docker-compose.yml` is configured for the NEW architecture (Postgres, Redis, Next.js, FastAPI), making it incompatible with the legacy codebase.

## 13. Problems and Critical Issues

> [!WARNING]
> **Directory Renaming Broke Deployments**
> The `render.yaml` and `docker-compose.yml` files are pointing to `backend/` and `frontend/`. Since the Flask/React apps were moved to `-legacy` folders to make way for the new stack, the deployment scripts are completely broken.

> [!CAUTION]
> **Split Codebase**
> We have two competing implementations in the same repo. The Next.js/FastAPI migration is incomplete, but its folders (`frontend`/`backend`) have taken the primary namespace.

## 14. Recommended Architecture Plan (Option B)

**Gradually Modernize (Recommended)**
Given that the existing Flask/React/MongoDB system is fully featured and functional, we should select **Option B**.
1. **Stabilize:** Revert or rename directories so that the existing, working Flask/React code is the primary application (e.g., restore `frontend-legacy` to `frontend` and `backend-legacy` to `backend`). Clean up the broken Next.js/FastAPI boilerplate to avoid confusion.
2. **Fix Deployments:** Ensure `render.yaml`, `vercel.json`, and local Docker compose files correctly point to the stabilized React/Flask implementation.
3. **Iterate:** Only modernize specific components (like swapping Flask for FastAPI) when there is a tangible performance or scalability need, rather than a full rewrite.
