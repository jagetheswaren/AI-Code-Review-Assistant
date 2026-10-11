# IntelliReview AI V2 — Complete System Architecture

## 1. Vision & System Overview

**IntelliReview AI V2** is an enterprise-grade automated code review and GitHub pull request analysis platform. Built for modern development workflows, it seamlessly combines deterministic static security analysis, AST code quality linting, cyclomatic complexity profiling, machine-learning-driven severity classification, and context-aware LLM explanations into a unified developer tool.

### Core Capabilities
- **Instant Public Code Review (Journey A):** Zero-barrier code review directly from the landing page. Paste code or upload source files, execute real multi-engine scans, inspect code lines and diffs, and receive instant explanations.
- **GitHub Repository Analysis (Journey B):** Authenticated exploration of connected repositories, branches, file trees, and source snapshots.
- **Automated Pull Request Review (Journey C):** Webhook-driven CI/CD integration with HMAC-SHA256 signature verification, PR diff retrieval, multi-file analysis, and authorized GitHub review comment posting.
- **Data-Driven Analytics Dashboard (Journey D):** Persistent review history, risk distributions, 30-day time-series trend analysis, and PDF/CSV/JSON report generation.

---

## 2. High-Level Architecture Diagram

```text
                                  ┌────────────────────────┐
                                  │   DEVELOPER / USER     │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [Public Instant Review]                            [Authenticated Workspace]
                      │                                               │
                      ▼                                               ▼
      ┌────────────────────────────────────────────────────────────────────────┐
      │                      React 19 Frontend ("Obsidian Signal")             │
      │  • Monaco Code Editor (Diff & Line Jump) • Framer Motion & ReactBits   │
      │  • TanStack Query & Axios Client         • Chart.js Trends & Dashboards│
      └───────────────────────────────────┬────────────────────────────────────┘
                                          │ HTTP / HTTPS (REST API)
                                          ▼
      ┌────────────────────────────────────────────────────────────────────────┐
      │                      Flask 3 Application Gateway                       │
      │  • ProxyFix & Security Middleware       • Dynamic CORS Control         │
      │  • Rate Limiting (Token Bucket)         • PyJWT & bcrypt Security      │
      └───────┬───────────────────────────┬────────────────────────────┬───────┘
              │                           │                            │
              ▼                           ▼                            ▼
   ┌──────────────────────┐    ┌──────────────────────┐    ┌───────────────────────┐
   │ Static Analyzers     │    │ ML Severity Engine   │    │ AI Review Subsystem   │
   │ • Bandit (Security)  │    │ • Scikit-learn RF v3 │    │ • Ollama (Local)      │
   │ • AST Custom Visitor │    │ • Feature Vector v2  │    │ • Groq (Cloud LLM)    │
   │ • Pylint / Astroid   │    │ • Zero-leakage Rules │    │ • Structured JSON     │
   │ • Radon (Complexity) │    │ • Model versioning   │    │ • Static Fallback     │
   └──────────┬───────────┘    └──────────┬───────────┘    └───────────┬───────────┘
              │                           │                            │
              └───────────────────────────┼────────────────────────────┘
                                          ▼
                              ┌───────────────────────┐
                              │  Finding Aggregator   │
                              │ (Deduplication, CWEs) │
                              └───────────┬───────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
         ┌───────────────────────┐                 ┌───────────────────────┐
         │ MongoDB Atlas / Local │                 │   GitHub REST & CI    │
         │ • users, scans        │                 │ • OAuth2 / PAT flow   │
         │ • repositories, PRs   │                 │ • Webhook HMAC-SHA256 │
         │ • settings, alerts    │                 │ • PR Review Comments  │
         └───────────────────────┘                 └───────────────────────┘
```

---

## 3. Technology Stack Reference

| Layer | Component | Version / Library | Architectural Role |
|---|---|---|---|
| **Frontend** | Framework | React 19 (`19.2.8`) | Core UI rendering & lifecycle |
| | Build System | `react-scripts` (`5.0.1`) | Webpack-based compilation |
| | Styling | Tailwind CSS (`3.4.19`) | "Obsidian Signal" design tokens |
| | Code Editor | `@monaco-editor/react` | In-browser IDE, syntax & decorations |
| | Motion | `framer-motion` & `motion` | Micro-interactions, transitions, modals |
| | Visuals | ReactBits (Custom) | SplitText, Magnet, ElectricBorder, GridScan |
| | State & Cache | `@tanstack/react-query` | Asynchronous query caching & invalidation |
| | Charts | Chart.js & `react-chartjs-2` | Severity donuts, 30-day time-series |
| **Backend** | Framework | Flask (`3.1.3`) | RESTful application server |
| | Validation | Pydantic (`2.13.4`) | Strict data serialization & validation |
| | Security | PyJWT & bcrypt | Authentication, password hashing |
| | Analysis | Bandit (`1.9.4`) | Static security vulnerability scanning |
| | AST Tools | `ast` & `astroid` (`4.0.4`) | Abstract syntax tree inspection |
| | Quality | Pylint (`4.0.6`) | Code smell and maintenance checks |
| | Complexity | Radon (`6.0.1`) | Cyclomatic complexity (CC) & MI |
| | ML Pipeline | `scikit-learn` (`1.9.0`) | Random Forest severity classifier (v3) |
| | AI Inference | Ollama (`0.6.2`) / Groq | Context-aware finding explanations |
| | Database | MongoDB 9.0.2 / PyMongo | Document persistence & analytics |
| | Reporting | ReportLab (`5.0.0`) | PDF, CSV, and JSON report generation |

---

## 4. Design System: "Obsidian Signal"

The interface implements the **Obsidian Signal** developer workspace language:

### Color Palette
- **Primary Background:** `#080B10`
- **Secondary Background:** `#0D121B`
- **Panel Surface:** `#121A25`
- **Elevated Surface:** `#192333`
- **Primary Accent (Cyan):** `#63E6FF`
- **Secondary Accent (Violet):** `#8B7CFF`
- **Success:** `#39D98A`
- **Warning:** `#FFB454`
- **Critical:** `#FF6178`
- **Primary Text:** `#E6F1FF`
- **Muted Text:** `#9BAFC8`
- **Subtle Borders:** `#293446` / `white/[0.08]`

---

## 5. Security & Boundary Architecture

1. **Unexecuted Code Isolation:** Source code submitted for analysis is parsed solely via Python's AST parser, Bandit AST tokens, and Pylint/Astroid analysis. **Uploaded code is NEVER executed, imported, or eval'd at runtime.**
2. **Webhook Integrity:** All incoming GitHub webhooks are validated using cryptographic HMAC-SHA256 (`X-Hub-Signature-256`) against the server's configured webhook secret. In-memory and database replay detection prevents duplicate analysis runs.
3. **Owner-Scoped Queries:** All scan history, repositories, pull requests, and reports are queried with explicit `user_id` filters in MongoDB.
4. **Resilient AI Degradation:** If neither Ollama nor Groq is accessible, the review pipeline gracefully completes static analysis and ML prioritization, returning structured findings with an explicit status badge (`static_analysis: true, ai_available: false`).
