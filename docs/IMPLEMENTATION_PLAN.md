# IntelliReview AI V2 — Complete Implementation Plan

**Branch:** `feature/intellireview-v2`  
**Execution Strategy:** Autonomous, Phase-by-Phase Full Stack Delivery  

---

## Phase Roadmap

### PHASE 0 — Repository Audit (COMPLETED)
- [x] Inspect entire codebase, manifests, and dependencies.
- [x] Verify local MongoDB 9.0.2 service and collections.
- [x] Run baseline backend test suite (`pytest -v`: 100 passed, 1 skipped).
- [x] Run baseline frontend test suite (`npm run test:ci`: 5 passed).
- [x] Verify frontend production compilation (`npm run build`: Success).
- [x] Create dedicated upgrade branch `feature/intellireview-v2`.
- [x] Generate `docs/PROJECT_AUDIT.md`, `docs/FEATURE_MATRIX.md`, `docs/IMPLEMENTATION_PLAN.md`.

---

### PHASE 1 — Frontend Foundation & Navigation Flow
**Objective:** Perfect the Obsidian Signal design system and unblock instant public review.
- [ ] Update `App.jsx` routing:
  - Make `/review` accessible to both unauthenticated and authenticated users (render public workspace).
  - Ensure protected routes redirect to landing with state retention for actions requiring an account.
- [ ] Connect Landing page CTA buttons ("Start Reviewing", "Start Live Review") directly to `/review`.
- [ ] Add standardized `data-testid` attributes to key interactive elements for Playwright E2E coverage.
- [ ] Clean up unused imports and ESLint warnings across frontend components.

---

### PHASE 2 — Review Workspace & Interactive UX
**Objective:** Enhance the review workspace into an elite developer SaaS experience.
- [ ] In `Review.jsx`:
  - Support instant public scanning without requiring an auth token.
  - Add save prompt modal for guest users after running an instant scan ("Save this scan to your history").
  - Add multi-language indicator & mode switch with explicit analyzer capabilities (Python: Full AST + Bandit + Pylint + Radon + ML; JS/TS: Syntax & AI-assisted review).
  - Enhance Monaco Editor styling, theme synchronization, and diff comparison panel.
  - Implement real scan progress simulation states (Uploading -> AST Parsing -> Bandit Security Scan -> Smell & Complexity -> ML Scoring -> Complete).

---

### PHASE 3 — Backend API Stabilization & Unauthenticated Instant Review
**Objective:** Support optional token authentication and robust error normalization.
- [ ] In `backend/api/review_routes.py`:
  - Implement `@optional_token` decorator: if Authorization header is missing, proceed with `g.current_user = None` instead of rejecting with HTTP 401.
  - In `_perform_analysis`: if `user_id` is None, execute real static analyzers + ML + AI, but skip persisting to user scan history (or save anonymous scan), returning full findings in response.
  - Keep strict rate limiting (20 req/min) and max code payload limits (500KB) to prevent abuse.
- [ ] Verify backward compatibility of all existing authenticated endpoints.
- [ ] Run backend tests to verify 0 regressions.

---

### PHASE 4 — Static Analysis & Multi-Language Enhancements
**Objective:** Strengthen security rules and clarify multi-language boundaries.
- [ ] Expand security rule coverage in `backend/analyzers/security_analyzer.py` (e.g., pickle deserialization, yaml.load without Loader, subprocess shell=True, weak hashing MD5/SHA1).
- [ ] Add multi-language static helper in `backend/analyzers/` declaring exact analyzer capabilities for Python, JavaScript/TypeScript, Java, C/C++.
- [ ] Ensure `FindingAggregator` tags findings with precise rule IDs, source engines, and remediation snippets.

---

### PHASE 5 — AI & Machine Learning Pipeline
**Objective:** Validate ML classifier and ensure reliable structured AI responses.
- [ ] Evaluate Random Forest v3 severity classifier: verify rule severity map, prevent class downgrade for critical vulnerabilities.
- [ ] Ensure `AIReviewer` handles timeout, unavailable Ollama host, and Groq fallback cleanly with informative structured messages.
- [ ] Add unit test verifying that guest instant reviews work without requiring a JWT token.

---

### PHASE 6 — GitHub Automation & Webhooks
**Objective:** Solidify repository exploration, PR diff parsing, and webhook idempotency.
- [ ] Verify GitHub PAT connection and repository tree loading.
- [ ] Verify webhook HMAC-SHA256 signature checking and replay protection.
- [ ] Confirm PR review comment formatter works with line numbers and Markdown diff formatting.

---

### PHASE 7 — Database, History, Analytics & Reports
**Objective:** Ensure user data integrity, analytics accuracy, and export fidelity.
- [ ] Verify scan persistence in MongoDB for authenticated runs.
- [ ] Verify statistics aggregations and 30-day trend chart pipelines.
- [ ] Verify ReportLab PDF, CSV, and JSON export streams.

---

### PHASE 8 — Quality Assurance, E2E Testing & Security
**Objective:** Complete automated test suite covering all end-to-end user journeys.
- [ ] Update Playwright E2E specs in `frontend/tests/e2e/` to align with the V2 UI.
- [ ] Add tests for guest instant review flow.
- [ ] Run full pytest backend suite and frontend Jest/CI suite.
- [ ] Audit dependencies for security vulnerabilities.

---

### PHASE 9 — Production Deployment & Documentation
**Objective:** Finalize containerization, CI/CD configuration, and production documentation.
- [ ] Update `docker-compose.yml`, `Dockerfile`, `render.yaml`, `vercel.json`.
- [ ] Generate comprehensive documentation: `README.md`, `ARCHITECTURE.md`, `API_DOCS.md`, `DATABASE.md`, `DEPLOYMENT.md`, `SECURITY.md`, `TESTING.md`, `AI_MODELS.md`, `GITHUB_INTEGRATION.md`, `DEVELOPMENT_PROGRESS.md`.
- [ ] Verify production frontend build cleanly passes.

---

### PHASE 10 — Final Verification & Delivery Report
- [ ] Validate all 4 user journeys end-to-end.
- [ ] Generate structured Master Completion Delivery Report.
