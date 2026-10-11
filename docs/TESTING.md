# IntelliReview AI V2 — Testing & QA Strategy

## 1. Test Suite Architecture

IntelliReview AI V2 employs automated quality assurance across three distinct testing tiers:
1. **Backend Unit & Integration Tests (pytest)**: API contracts, analyzers, ML severity classifier, GitHub services, and MongoDB operations.
2. **Frontend Unit & Component Tests (Jest / React Testing Library)**: Core UI components, layout structures, and state management.
3. **End-to-End Browser Testing (Playwright)**: Full browser automation testing user journeys across Mobile, Tablet, and Desktop form factors.

---

## 2. Test Execution & Verified Results

### 2.1 Backend Test Results (`pytest`)
- **Command**: `.\venv\Scripts\pytest.exe -v`
- **Result**: **102 passed, 1 skipped** (103 total)
- **Coverage**:
  - `test_analyzers.py`: 14 tests verifying SecurityAnalyzer (Bandit, custom AST, SQL injection, insecure tempfiles), SmellAnalyzer (Pylint, unused variables, imports), ComplexityAnalyzer (Radon).
  - `test_ml_pipeline.py`: 41 tests verifying Random Forest classifier, V2 feature extraction without target leakage, synthetic generator, model loading, and deterministic overrides.
  - `test_api_endpoints.py`: Auth registration/login, AI status reporting, instant review claim endpoint, scan trends.
  - `test_github_integration.py`: 11 tests verifying webhook HMAC-SHA256 signature verification, PAT storage, OAuth flow, and PR diff scanning.
  - `test_ai_integration.py`: 27 tests verifying Ollama & Groq provider health, prompt structuring, JSON schema repair, and graceful fallback behavior.
  - `test_e2e.py` & `test_simulated_workflow.py`: Full end-to-end user workflows from guest scan to persistence.

### 2.2 Frontend Unit Tests (`Jest`)
- **Command**: `npm run test:ci` (in `frontend/`)
- **Result**: **2 test suites passed, 5 tests passed**
- **Tested Components**: `App.test.js`, UI primitives, theme providers.

### 2.3 End-to-End Browser Tests (`Playwright`)
- **Command**: `npx playwright test` (in `frontend/`)
- **Result**: **11 passed in 16.6s**
- **Test Matrix**:
  - `auth.spec.ts`: Login validation error toasts, navigation between `/landing`, `/login`, and `/register`.
  - `home.spec.ts`: Title verification (`IntelliReview`), visible sign-in and start review buttons.
  - `review.spec.ts`: Monaco editor rendering, analysis trigger, scan history display.
  - `responsive.spec.ts`:
    - Landing page rendering on Mobile (360x800), Tablet (768x1024), Desktop (1440x900) without horizontal scroll overflow.
    - Dashboard rendering on Mobile, Tablet, and Desktop with metric cards, trends, and quick actions.

---

## 3. Running Tests Locally

### Backend Tests
```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run full test suite
pytest -v

# Run specific suite
pytest backend/tests/test_analyzers.py -v
```

### Frontend Tests
```powershell
cd frontend

# Run unit tests
npm run test:ci

# Run Playwright E2E tests (starts local dev server automatically)
npx playwright test
```

### CI/CD Workflow
The repository contains `.github/workflows/ci.yml` which executes all backend tests and frontend tests on pushes and pull requests to `main` and `feature/*` branches.
