# IntelliReview AI — Complete Project Architecture

## 1. What is IntelliReview AI?

**IntelliReview AI** is an AI-powered code review platform.

A user can:
* Register/login
* Submit source code
* Upload code files
* Analyze security vulnerabilities
* Detect code smells
* Detect performance problems
* Calculate code complexity
* Predict issue severity using ML
* Generate AI explanations using Ollama
* View results on a dashboard
* View previous reviews
* Export reports as JSON/CSV/PDF
* Connect GitHub
* Select repositories
* Analyze pull requests
* Automatically comment review results on GitHub PRs
* Trigger automatic reviews through GitHub webhooks

The core idea is:
```text
Developer
   ↓
Submit Code / GitHub PR
   ↓
IntelliReview AI
   ↓
Static Analysis
   ↓
Machine Learning
   ↓
AI Explanation
   ↓
Store Results
   ↓
Display Results
   ↓
Optional GitHub PR Comment
```

---

## 2. Complete Architecture

```text
                         ┌──────────────────────┐
                         │       USER           │
                         │ Developer / Student  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │       React 19 Frontend      │
                    │                              │
                    │ Tailwind CSS                 │
                    │ React Router                 │
                    │ Axios                        │
                    │ Chart.js                     │
                    │ Monaco Editor                │
                    └──────────────┬───────────────┘
                                   │
                              HTTP/HTTPS
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │       Flask REST API         │
                    │                              │
                    │ Authentication               │
                    │ JWT                          │
                    │ CORS                         │
                    │ Security Headers             │
                    │ Review API                   │
                    │ GitHub API                   │
                    │ Export API                   │
                    └──────────────┬───────────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
                  ▼                ▼                ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │ Static       │ │ ML Severity  │ │   Ollama     │
          │ Analysis     │ │ Classifier   │ │ AI Reviewer  │
          └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                 │                │                │
                 └────────────────┼────────────────┘
                                  ▼
                       ┌────────────────────┐
                       │ Finding Aggregator │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │   MongoDB Atlas    │
                       │                    │
                       │ Users              │
                       │ Scans              │
                       │ Findings           │
                       │ History            │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ React Dashboard    │
                       └────────────────────┘


GitHub
   │
   ├── OAuth
   │
   ├── Repository API
   │
   ├── Pull Request API
   │
   └── Webhook
          │
          ▼
     Flask API
          │
          ▼
     Review Pipeline
          │
          ▼
     GitHub PR Comment
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 | User interface |
| Styling | Tailwind CSS | UI styling |
| Routing | React Router | Page navigation |
| HTTP | Axios | Frontend → backend communication |
| Charts | Chart.js | Dashboard visualization |
| Editor | Monaco Editor | Code editing/viewing |
| Backend | Python | Application logic |
| API | Flask 3 | REST API |
| Authentication | JWT | Login/session authentication |
| Password security | bcrypt | Password hashing |
| CORS | Flask-CORS | Frontend/backend communication |
| Database | MongoDB Atlas | Persistent storage |
| DB driver | PyMongo | Python → MongoDB |
| Security analysis | Bandit | Python security vulnerabilities |
| Code analysis | AST/astroid | Code smells/structure |
| Complexity | Radon | Cyclomatic complexity |
| Performance | Custom AST analysis | Performance patterns |
| ML | scikit-learn | Severity prediction |
| Model storage | joblib | Save/load ML model |
| AI | Ollama | AI explanation |
| AI model | qwen2.5-coder:3b | Code explanation |
| GitHub | GitHub REST API | Repository/PR integration |
| OAuth | GitHub OAuth | GitHub authentication |
| Webhook | GitHub Webhooks | Automatic PR reviews |
| Security | HMAC SHA-256 | Webhook verification |
| PDF | ReportLab | PDF reports |
| Testing | pytest | Backend tests |
| Testing | frontend test setup | Frontend tests |
| Mock DB | mongomock | Automated DB tests |
| Frontend hosting | Vercel | React deployment |
| Backend hosting | Render | Flask deployment |
| Database hosting | MongoDB Atlas | Cloud database |
| AI runtime | Ollama | Local/remote AI inference |

---

## 4. Frontend Architecture

The React frontend is the presentation layer. Conceptually:

```text
frontend/
│
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Review.jsx
│   │   ├── History.jsx
│   │   ├── HistoryDetail.jsx
│   │   ├── Reports.jsx
│   │   ├── Security.jsx
│   │   ├── Quality.jsx
│   │   ├── Performance.jsx
│   │   ├── GitHubIntegration.jsx
│   │   ├── Repository.jsx
│   │   └── PullRequest.jsx
│   │
│   ├── api/
│   │   └── client.js
│   │
│   ├── components/
│   │
│   ├── App.js
│   └── ...
```

---

## 5. React → Flask Connection

The frontend does not directly talk to MongoDB. It works like this:

```text
React
  │
  │ Axios
  ▼
Flask API
  │
  ▼
MongoDB
```

The browser never receives `MONGO_URI`, `GITHUB_TOKEN`, `GITHUB_CLIENT_SECRET`, or `JWT_SECRET`. These remain backend secrets.

---

## 6. Centralized Axios Client

The `frontend/src/api/client.js` is critical. Instead of every page manually configuring URLs, it provides centralized API communication.

```text
Dashboard.jsx
       │
History.jsx ──────┐
Review.jsx ───────┤
Reports.jsx ──────┤
GitHub.jsx ───────┤
                  ▼
             api/client.js
                  │
                  ▼
             Flask Backend
```

This makes changing `localhost → Render` much easier for deployment.

---

## 7. Review Pipeline

This is the **heart of the project**.

```text
Source Code
     ↓
┌─────────────────────┐
│ Security Analysis   │
│ Bandit              │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Code Smell Analysis │
│ AST / astroid       │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Performance         │
│ AST patterns        │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Complexity          │
│ Radon               │
└──────────┬──────────┘
           │
           ▼
   FindingAggregator
           │
           ▼
     ML Severity
           │
           ▼
       Ollama
           │
           ▼
     Final Findings
           │
           ▼
       MongoDB
```

---

## 8. Why ML is separate from static analysis

Static analyzers detect: *"What problem exists?"*
ML predicts: *"How severe is this problem likely to be?"*
AI explains: *"What does this mean and how should the developer understand it?"*

These are different responsibilities processed sequentially:
`Static Analysis → Finding → ML → Severity → AI → Explanation`

---

## 9. Local vs Production Architecture

### Local Development
```text
┌──────────────┐
│ React        │
│ localhost    │
│ :3000        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Flask        │
│ localhost    │
│ :5000        │
└──────┬───────┘
       │
   ┌───┴──────────────┐
   ▼                  ▼
MongoDB Atlas       Ollama
                    :11434
       │
       ▼
     GitHub
```

### Production
```text
                   INTERNET
                       │
             ┌─────────▼─────────┐
             │       Vercel      │
             │   React Frontend  │
             └─────────┬─────────┘
                       │ HTTPS
                       ▼
             ┌───────────────────┐
             │      Render       │
             │   Flask Backend   │
             └───────┬────┬──────┘
                     │    │
             ┌───────┘    └─────────┐
             ▼                      ▼
     ┌──────────────┐       ┌──────────────┐
     │ MongoDB      │       │ Ollama       │
     │ Atlas        │       │ Reachable    │
     └──────────────┘       └──────────────┘
             │
             ▼
        Persistent DB

             Render
                │
                ▼
             GitHub
```

## The simplest way to remember the project

The entire system has **5 major layers**:

1. **PRESENTATION**: React + Tailwind
2. **API / BUSINESS LOGIC**: Flask + JWT
3. **CODE INTELLIGENCE**: Bandit + AST + Radon + Performance
4. **AI INTELLIGENCE**: ML RandomForest + Ollama
5. **PERSISTENCE + INTEGRATIONS**: MongoDB Atlas + GitHub

> **IntelliReview AI receives source code or GitHub pull requests, analyzes the code using multiple static-analysis techniques, predicts finding severity with machine learning, generates developer-oriented explanations with an AI coding model, stores the results in MongoDB, displays them through a React dashboard, and can automatically publish the review back to GitHub pull requests.**
