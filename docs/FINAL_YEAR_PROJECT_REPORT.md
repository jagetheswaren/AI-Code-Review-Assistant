# INTELLIREVIEW AI: AI-BASED CODE REVIEW & SECURITY ASSISTANT
## Final Year Project Report & Technical Specification Manual

---

## 1. ABSTRACT
Modern software engineering demands high-velocity code delivery without compromising security, maintainability, or performance. Traditional static analysis tools often produce high rates of false positives and lack contextual explanations, while manual code reviews are slow and bottleneck development pipelines. 

**IntelliReview AI** is an enterprise-grade, full-stack AI platform designed to automate code reviews for GitHub Pull Requests and local codebases. By unifying traditional static code analysis engines (Bandit for security, Astroid for code smells, Radon for complexity) with a Machine Learning severity classification model (Random Forest, 99.25% accuracy) and a Natural Language Processing engine (CodeBERT), IntelliReview AI automatically identifies vulnerabilities (e.g., SQL Injection, Hardcoded Secrets, Unsafe Deserialization), computes maintainability metrics, and generates AI explanations alongside automated side-by-side refactoring diffs.

---

## 2. PROBLEM STATEMENT
1. **Manual Review Bottlenecks**: Senior engineers spend hundreds of hours reviewing Pull Requests manually, creating release delays.
2. **Abstract Tool Output**: Traditional static analysis tools report error codes without explaining *why* the code is vulnerable or *how* to refactor it.
3. **High False Positive Rates**: Developers ignore critical alerts due to poor severity calibration in static linters.
4. **Lack of Automated Remediation**: Linters highlight lines of code but rarely provide verified, drop-in replacement fixes.

---

## 3. OBJECTIVES OF PROPOSED SYSTEM
- Automatically inspect incoming GitHub Pull Requests via Webhook triggers.
- Run static security analysis (Bandit), AST linting (Astroid), and cyclomatic complexity scoring (Radon).
- Apply a trained Random Forest ML model to predict severity and confidence scores.
- Generate natural language explanations and AI Auto-Fix refactoring suggestions using NLP models.
- Present a Monaco-style side-by-side code diff inspector.
- Provide executive report exports in PDF, CSV, and JSON formats.

---

## 4. SYSTEM ARCHITECTURE & MODULE DIAGRAM

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER / GITHUB PR                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Webhook / API Request
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FLASK REST API BACKEND                          │
│                (Gunicorn WSGI + JWT Auth + CORS)                       │
└───────┬───────────────────────────┬───────────────────────────┬────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│  STATIC CODE │            │   ML MODEL   │            │  NLP ENGINE  │
│  ANALYZERS   │            │ Random Forest│            │   CodeBERT   │
│ Bandit/Radon │            │  Classifier  │            │  Explainer   │
└───────┬──────┘            └──────┬───────┘            └──────┬───────┘
        │                          │                           │
        └──────────────────────────┼───────────────────────────┘
                                   │ Aggregate Findings
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           MONGODB DATABASE                             │
│                  (Collections: users, scans, settings)                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ REST API Responses
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT 19 SPA FRONTEND                           │
│   (Dashboard, Monaco Diff, Security Inspector, AI Chat, PDF Exporter)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. DATABASE SCHEMA DESIGN (MONGODB ATLAS)

### Collections:
1. **`users`**:
   - `_id`: ObjectId
   - `username`: String (Unique)
   - `email`: String (Unique)
   - `password_hash`: String (Bcrypt)
   - `role`: String (`developer` | `admin`)
   - `created_at`: DateTime

2. **`scans`**:
   - `_id`: ObjectId
   - `user_id`: ObjectId (Ref: `users`)
   - `request_id`: UUID String
   - `file_analyses`: Array of FileAnalysis objects
   - `summary`: Total issues, severity counts, risk score
   - `ai_review`: Natural language summary string
   - `github_pr_url`: String (Optional)
   - `created_at`: DateTime

---

## 6. MACHINE LEARNING & ALGORITHMIC SPECIFICATION

### ML Severity Classifier Algorithm: Random Forest
- **Features Extracted**: Issue message length, rule ID prefix, AST node depth, line count.
- **Model**: `RandomForestClassifier(n_estimators=100, max_depth=15)`
- **Evaluation Accuracy**: **99.25%**
- **Classes**: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`

### Static Analysis Engines:
1. **Bandit**: Scans Python AST for security issues (CWE / OWASP mapping).
2. **Astroid**: Performs deep AST linting for unused imports, dead code, and variable scope.
3. **Radon**: Computes Cyclomatic Complexity $V(G) = E - N + 2P$ and Maintainability Index.

---

## 7. TEST CASES & EMPIRICAL RESULTS

| Test ID | Module Tested | Input | Expected Output | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Auth Module | POST `/api/register` | 201 Created + JWT Token | ✅ PASS |
| **TC-02** | Security Analyzer | Hardcoded Password | Flagged CRITICAL (Bandit B105) | ✅ PASS |
| **TC-03** | ML Predictor | Rule B608 (SQLi) | Predicted `CRITICAL` (Conf > 98%) | ✅ PASS |
| **TC-04** | PDF Generator | GET `/api/export/pdf/id` | 200 OK (`application/pdf` binary) | ✅ PASS |
| **TC-05** | E2E Integration | `pytest backend/tests` | 17/17 Unit & Integration Passed | ✅ PASS |

---

## 8. FUTURE SCOPE (VERSION 2.0)
1. **Multi-Language Support**: Expand beyond Python to Java, JavaScript, TypeScript, Go, and C++.
2. **GitHub App Marketplace Integration**: Deploy as an official GitHub App on GitHub Marketplace.
3. **IDE Extensions**: Provide real-time inline AI review highlights inside VS Code and JetBrains IDEs.

---

## 9. CONCLUSION
**IntelliReview AI** successfully demonstrates the integration of machine learning, natural language processing, and static analysis inside a modern full-stack web architecture. By providing automated reviews, severity predictions, and side-by-side AI refactoring diffs, the platform dramatically reduces developer review workloads and improves overall software quality.
