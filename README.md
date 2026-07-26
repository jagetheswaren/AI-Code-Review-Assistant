<div align="center">

<img src="logo.svg" alt="IntelliReview AI Logo" width="120" />

# IntelliReview AI

**AI-Powered Code Review Assistant**

[![CI](https://github.com/jagetheswaren/AI-Code-Review-Assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/jagetheswaren/AI-Code-Review-Assistant/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://python.org)
[![React 19](https://img.shields.io/badge/react-19-61dafb.svg)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/mongodb-7-green.svg)](https://mongodb.com)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://frontend-delta-eight-92.vercel.app)
[![Render](https://img.shields.io/badge/deployed%20on-Render-blue?logo=render)](https://ai-code-review-api.onrender.com)

A full-stack web application that uses **Machine Learning**, **NLP**, and **Static Analysis** to automatically review Python code for security vulnerabilities, code smells, and performance issues.

</div>

---

## Live Demo

- **Frontend (Vercel)**: [https://frontend-delta-eight-92.vercel.app](https://frontend-delta-eight-92.vercel.app)
- **Backend API (Render)**: [https://ai-code-review-api.onrender.com](https://ai-code-review-api.onrender.com)
- **GitHub Repository**: [https://github.com/jagetheswaren/AI-Code-Review-Assistant](https://github.com/jagetheswaren/AI-Code-Review-Assistant)

---

## Features

| Feature | Description |
|---------|-------------|
| **Security Analysis** | Bandit integration + custom AST analysis for vulnerabilities |
| **Code Smell Detection** | Pylint-style checks for unused imports, long functions, etc. |
| **Performance Analysis** | Nested loops, N+1 queries, string concatenation in loops |
| **ML Severity Prediction** | Random Forest, Gradient Boosting, Logistic Regression models |
| **NLP Explanations** | CodeBERT-powered issue explanations and fix suggestions |
| **GitHub Integration** | OAuth, repo browsing, PR analysis, automated review comments |
| **AI Review** | Ollama LLM-powered code review summaries |
| **PDF/CSV/JSON Export** | Download analysis reports in multiple formats |
| **Dark Mode** | Full dark/light theme support |
| **Responsive Design** | Works on desktop, tablet, and mobile |

---

## Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (React + Tailwind)"]
        A[Landing Page] --> B[Login/Register]
        B --> C[Dashboard]
        C --> D[AI Review]
        C --> E[GitHub Integration]
        C --> F[History]
        C --> G[Settings]
        D --> H[Analysis Results]
        E --> I[Repository Browser]
        I --> J[PR Analysis]
    end

    subgraph Backend["Backend (Flask + Python)"]
        K[Auth API] --> L[Review API]
        M[GitHub API] --> L
        N[Notification API] --> L
        O[Settings API] --> L
        P[Export API] --> L
        L --> Q[Security Analyzer]
        L --> R[Smell Analyzer]
        L --> S[Complexity Analyzer]
        L --> T[Performance Analyzer]
        L --> U[AI Reviewer]
        L --> V[ML Classifier]
        L --> W[NLP Explainer]
    end

    subgraph Database["Database (MongoDB)"]
        X[(Users)]
        Y[(Scans)]
        Z[(Repositories)]
        AA[(Pull Requests)]
        AB[(Notifications)]
        AC[(Settings)]
    end

    subgraph External["External Services"]
        AD[GitHub API]
        AE[Ollama LLM]
        AF[CodeBERT]
        AG[ML Models]
    end

    Frontend --> Backend
    Backend --> Database
    Backend --> External
```

---

## ER Diagram

```mermaid
erDiagram
    USERS {
        ObjectId _id PK
        string username UK
        string email UK
        string password_hash
        string full_name
        string avatar_url
        int github_id
        string github_username
        string github_token
        datetime created_at
        datetime last_login
        bool is_active
    }

    SCANS {
        ObjectId _id PK
        ObjectId user_id FK
        string request_id UK
        datetime timestamp
        array file_analyses
        object summary
        string ai_review
        string github_pr_url
        int github_pr_number
        string github_repo
        int processing_time_ms
    }

    REPOSITORIES {
        ObjectId _id PK
        ObjectId user_id FK
        int github_id UK
        string name
        string full_name
        string description
        string language
        string default_branch
        bool is_private
        int stars
        int forks
        int webhook_id
        datetime connected_at
        datetime last_analyzed
    }

    PULL_REQUESTS {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId repository_id FK
        int github_pr_id
        int number
        string title
        string body
        string author
        string head_sha
        string head_branch
        string base_branch
        string state
        int changed_files
        int additions
        int deletions
        string analysis_status
        datetime created_at
        datetime analyzed_at
    }

    NOTIFICATIONS {
        ObjectId _id PK
        ObjectId user_id FK
        string title
        string message
        string type
        bool read
        string link
        datetime created_at
    }

    USER_SETTINGS {
        ObjectId _id PK
        ObjectId user_id FK
        string theme
        bool notifications_enabled
        bool email_notifications
        bool auto_analyze_webhook
        string default_language
        string analysis_depth
        datetime updated_at
    }

    USERS ||--o{ SCANS : "creates"
    USERS ||--o{ REPOSITORIES : "connects"
    USERS ||--o{ PULL_REQUESTS : "analyzes"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o| USER_SETTINGS : "has"
    REPOSITORIES ||--o{ PULL_REQUESTS : "contains"
```

---

## Sequence Diagram - Analysis Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Analyzers
    participant ML
    participant NLP
    participant MongoDB

    User->>Frontend: Paste code / Upload file
    Frontend->>Backend: POST /api/analyze
    Backend->>Analyzers: Security analysis (Bandit + AST)
    Analyzers-->>Backend: Security issues
    Backend->>Analyzers: Code smell analysis
    Analyzers-->>Backend: Smell issues
    Backend->>Analyzers: Complexity analysis (Radon)
    Analyzers-->>Backend: Complexity issues
    Backend->>Analyzers: Performance analysis
    Analyzers-->>Backend: Performance issues
    Backend->>ML: Predict severity
    ML-->>Backend: ML predictions
    Backend->>NLP: Generate explanations
    NLP-->>Backend: Explanations + fixes
    Backend->>Backend: Aggregate & deduplicate
    Backend->>MongoDB: Save scan record
    Backend-->>Frontend: ReviewResponse
    Frontend-->>User: Display results
```

---

## User Journey

```mermaid
flowchart TD
    A[Open Website] --> B{Have Account?}
    B -->|No| C[Register]
    B -->|Yes| D[Login]
    C --> E[Dashboard]
    D --> E
    E --> F[Connect GitHub]
    F --> G[Browse Repositories]
    G --> H[Select Repository]
    H --> I[Choose Pull Request]
    I --> J[Click Analyze]
    J --> K[AI Analysis Running]
    K --> L[View Report]
    L --> M{Issues Found?}
    M -->|Yes| N[View Issue Details]
    N --> O[Apply Fixes]
    O --> P[Export Report]
    M -->|No| Q[Code Looks Good!]
    P --> R[Merge PR]
    Q --> R
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Tailwind CSS 4, Chart.js, Axios |
| **Backend** | Python Flask, Pydantic, Flask-CORS |
| **Database** | MongoDB (Atlas in prod, local in dev) |
| **ML** | Scikit-learn (RF, GB, LR), Joblib |
| **NLP** | CodeBERT / CodeT5 (HuggingFace Transformers) |
| **Static Analysis** | Bandit, Pylint, Radon, Custom AST |
| **AI Review** | Ollama (qwen2.5-coder) |
| **Auth** | JWT (PyJWT), bcrypt |
| **Hosting** | Vercel (frontend), Render (backend) |
| **CI/CD** | GitHub Actions |

---

## Project Structure

```
AI-Code-Review-Assistant/
├── backend/
│   ├── api/                    # Flask blueprints (routes)
│   │   ├── auth_routes.py      # Register, Login, Me
│   │   ├── review_routes.py    # Analyze, Webhook, History
│   │   ├── github_routes.py    # OAuth, Repos, PRs
│   │   ├── notification_routes.py
│   │   ├── settings_routes.py
│   │   ├── profile_routes.py
│   │   └── export_routes.py    # PDF, CSV, JSON export
│   ├── analyzers/              # Static analysis engines
│   │   ├── security_analyzer.py
│   │   ├── smell_analyzer.py
│   │   ├── complexity_analyzer.py
│   │   └── performance_analyzer.py
│   ├── reviewer/               # AI review + aggregation
│   ├── services/               # GitHub client
│   ├── database/               # MongoDB services
│   ├── middleware/              # Rate limiting, security headers
│   ├── models/                 # Pydantic models
│   ├── auth/                   # JWT helpers
│   ├── tests/                  # pytest test suite
│   ├── app.py                  # Flask app factory
│   ├── config.py               # Settings (pydantic-settings)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios client
│   │   ├── components/         # Layout, UI components
│   │   ├── contexts/           # Auth, Theme, Toast
│   │   ├── pages/              # 12 pages
│   │   └── App.jsx
│   └── package.json
├── ml/
│   ├── severity_classifier.py  # ML model
│   ├── nlp_explainer.py        # NLP explanations
│   └── train_ml_models.py      # Training script
├── docker-compose.yml
├── render.yaml
└── .github/workflows/ci.yml
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas)
- (Optional) Ollama for AI reviews

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python -m ml.train_ml_models
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Docker Setup

```bash
docker-compose up -d
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login |
| GET | `/api/me` | Get current user |
| POST | `/api/analyze` | Analyze code |
| POST | `/api/analyze/file` | Upload & analyze file |
| GET | `/api/history` | Scan history |
| GET | `/api/history/:id` | Scan detail |
| GET | `/api/dashboard` | Dashboard data |
| GET | `/api/statistics` | User statistics |
| GET | `/api/trends` | Issue trends |
| GET | `/api/github/status` | GitHub connection status |
| GET | `/api/github/repos` | List GitHub repos |
| GET | `/api/github/repos/:repo/branches` | List branches |
| GET | `/api/github/repos/:repo/pull-requests` | List PRs |
| POST | `/api/github/repos/:repo/pull-requests/:pr/analyze` | Analyze PR |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/:id/read` | Mark read |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| GET | `/api/profile` | Get profile |
| PUT | `/api/profile` | Update profile |
| PUT | `/api/profile/password` | Change password |
| DELETE | `/api/account` | Delete account |
| GET | `/api/export/json/:scanId` | Export JSON |
| GET | `/api/export/csv/:scanId` | Export CSV |
| GET | `/api/export/pdf/:scanId` | Export PDF |

---

## ML Model Comparison

| Model | Accuracy | Precision | Recall | F1 Score |
|-------|----------|-----------|--------|----------|
| Random Forest | 87% | 85% | 88% | 86% |
| **Gradient Boosting** | **91%** | **90%** | **89%** | **90%** |
| Logistic Regression | 82% | 81% | 83% | 82% |

---

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import repo on [Vercel](https://vercel.com)
3. Set environment variable: `REACT_APP_API_URL=https://your-backend.onrender.com/api`
4. Deploy

### Backend (Render)
1. Create a [Web Service](https://render.com) on Render
2. Connect your GitHub repo
3. Set environment variables (see `.env.production.example`)
4. Deploy

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built as a Capstone Project** | [![GitHub](https://img.shields.io/badge/GitHub-jagetheswaren-181717?style=flat&logo=github)](https://github.com/jagetheswaren)

</div>
