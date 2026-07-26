# NEXT.JS 15 + SUPABASE + PYTHON ANALYSIS SERVICE ARCHITECTURE (V2.0 EXTENSION)

## 1. ARCHITECTURE OVERVIEW

```text
                        GitHub
                          │
               OAuth + Webhooks (X-Hub-Signature-256)
                          │
                          ▼
            Next.js 15 (App Router / BFF)
     ┌─────────────────────────────────────────┐
     │ Dashboard & SaaS Frontend UI            │
     │ Supabase Auth (GitHub Social Login)     │
     │ API Routes (BFF Gateway)                │
     │ Server Actions & Realtime Subscriptions │
     └────────────────────┬────────────────────┘
                          │
          Supabase Postgres & RLS Policies
                          │
                          ▼
                Redis Job Queue (Celery)
                          │
                          ▼
       Python AI & Analysis Microservice
     ┌─────────────────────────────────────────┐
     │ FastAPI / Flask REST Engine             │
     │ Static Analyzers (Bandit, Radon, Linter)│
     │ Random Forest ML Model (99.25% Acc)     │
     │ CodeBERT NLP Explanation Generator      │
     └────────────────────┬────────────────────┘
                          │
                          ▼
              Supabase PostgreSQL Database
```

---

## 2. MONOREPO STRUCTURE

```text
intellireview-ai/
├── apps/
│   ├── web/                          # Next.js 15 (App Router + Tailwind + shadcn)
│   └── analysis-service/             # Python FastAPI / Flask AI Microservice
├── packages/
│   ├── ui/                           # Shared UI Component Library
│   ├── types/                        # TypeScript Interfaces & Schemas
│   └── utils/                        # Shared Helper Utilities
├── infrastructure/
│   ├── docker/                       # Docker & Compose Configurations
│   └── github-actions/               # CI/CD Workflows
└── docs/                             # Engineering System Specifications
```

---

## 3. NEXT.JS 15 APP ROUTER STRUCTURE (`apps/web/app`)

```text
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/page.tsx                # Main KPI Rings, Score Trends, PR Feed
├── repositories/
│   ├── page.tsx
│   └── [id]/page.tsx
├── pull-requests/
│   ├── page.tsx
│   └── [id]/page.tsx                 # Monaco Side-by-side Diff Inspector
├── analysis/page.tsx                 # AI Code Inspector & Playground
├── reports/page.tsx                  # PDF, CSV, JSON Export Center
├── security/page.tsx                 # OWASP Top 10 Inspector
├── quality/page.tsx                  # Astroid Smells & Radon Complexity
├── performance/page.tsx              # Big-O Algorithmic Benchmark
├── analytics/page.tsx                # Technical Debt & Health Trends
├── chat/page.tsx                     # ChatGPT-style Code Advisor
├── settings/page.tsx                 # GitHub Tokens & Webhook Secrets
├── api/
│   ├── auth/callback/route.ts
│   ├── webhooks/github/route.ts      # Validates HMAC SHA-256 & enqueues job
│   ├── analysis/start/route.ts
│   └── report/[format]/route.ts
├── layout.tsx
└── page.tsx
```

---

## 4. SUPABASE AUTH & ROW LEVEL SECURITY (RLS) POLICIES

```sql
-- Enable Row Level Security on Analyses Table
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Users can only read scan reports for repositories they own
CREATE POLICY "Users can view their repo analyses"
ON analyses FOR SELECT
USING (auth.uid() = user_id);

-- Enforce RLS on Repositories Table
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage owned repos"
ON repositories FOR ALL
USING (auth.uid() = user_id);
```

---

## 5. PYTHON ANALYSIS ENGINE CALL (FASTAPI / CELERY)

```python
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from analyzers.security_analyzer import SecurityAnalyzer
from analyzers.complexity_analyzer import ComplexityAnalyzer
from ml.severity_classifier import SeverityClassifier
from ai.code_explainer import CodeExplainer

app = FastAPI(title="IntelliReview AI Analysis Microservice")

sec_analyzer = SecurityAnalyzer()
comp_analyzer = ComplexityAnalyzer()
ml_classifier = SeverityClassifier()
ml_classifier.load()

class AnalysisPayload(BaseModel):
    code: str
    filename: str = "code.py"

@app.post("/analyze")
async def analyze_code(payload: AnalysisPayload):
    security_issues = sec_analyzer.analyze(payload.code, payload.filename)
    complexity_issues = comp_analyzer.analyze(payload.code, payload.filename)
    
    for issue in security_issues.issues:
        ml_res = ml_classifier.predict(issue.message, issue.rule_id, issue.line_number)
        issue.ml_severity = ml_res.get("severity")
        issue.ml_confidence = ml_res.get("confidence")
        
    return {
        "status": "success",
        "total_issues": len(security_issues.issues) + len(complexity_issues),
        "issues": security_issues.issues + complexity_issues
    }
```

---

## 6. MIGRATION ROADMAP (V1.0 TO V2.0)

1. **Phase 1 (Current State)**: Single-page Web Platform (`index.html`) + Flask WSGI REST API (`backend/`) + React SPA (`frontend/`) operational and verified with 17 passing pytest tests.
2. **Phase 2 (Monorepo Setup)**: Migrate React SPA to `apps/web` Next.js 15 App Router.
3. **Phase 3 (Supabase Integration)**: Connect Supabase Auth for GitHub OAuth and PostgreSQL Row-Level Security.
4. **Phase 4 (Python Microservice)**: Wrap existing Flask/FastAPI backend as `apps/analysis-service` triggered via Redis job queue.
