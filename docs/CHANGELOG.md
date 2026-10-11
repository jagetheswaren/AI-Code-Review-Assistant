# Changelog

All notable changes to IntelliReview AI V2 are documented here.

## [2.0.0] - 2026-10-08

### Major Release: IntelliReview AI V2 Upgrade

#### Frontend
- **Obsidian Signal Design System**: Implemented dark-first developer UI with custom typography (`Space Grotesk`, `Inter`, `JetBrains Mono`) and curated semantic tokens.
- **Unblocked Instant Review (Journey A)**: Visitors can immediately access `/review`, paste code, and receive real analysis without mandatory prior authentication.
- **Save Scan to Account**: Guest scans generate an ephemeral scan record which authenticated users can link to their account with `Save to Account`.
- **Workbench & Monaco Editor**: Integrated Monaco code editor with custom dark syntax highlighting, gutter markers, and side-by-side patch diff view.
- **React Bits & Fluid Motion**: Integrated microinteractions (`SplitText`, `SpotlightCard`, `StatusMark`, `ElectricBorder`) respecting reduced motion preferences.
- **Data-Driven Dashboard & History**: Real MongoDB-backed KPIs, activity trends, severity distribution charts, and paginated scan history.

#### Backend & APIs
- **Optional Token Authentication**: Upgraded `/api/analyze` and `/api/analyze/file` to support guest instant reviews, with a new `/api/scan/<id>/claim` endpoint.
- **Enhanced Security Analyzers**: Added detection for insecure temporary files (`mktemp`), weak hashing (`MD5`, `SHA-1`), plain-text network protocols (`telnetlib`, `ftplib`), and dynamic SQL string interpolation vulnerabilities.
- **Scikit-learn Severity Classifier**: Random forest model loading with V2 feature extraction preventing target leakage, preserving deterministic security severity as the authoritative signal.
- **Multi-Format Export**: Implemented `/api/export/{json,csv,pdf}/<scan_id>` with styled ReportLab PDF generation.
- **Robust Multi-Provider AI**: Resilient fallback architecture supporting Groq, local Ollama, and static rule-based remediation when AI services are offline.

#### GitHub Automation
- **Webhook HMAC-SHA256**: Constant-time signature verification for pull request open and synchronize events.
- **Delivery Idempotency**: Deduplication guard on `X-GitHub-Delivery` to prevent double-reviews.
- **PR Diff Parser**: Precise file and line mapping for review feedback.

#### Testing & CI/CD
- **102 Backend Tests Passed**: Full pytest coverage across analyzers, ML models, GitHub webhooks, and REST APIs.
- **11 Playwright E2E Tests Passed**: Multi-viewport testing across Mobile, Tablet, and Desktop.
- **5 Frontend Unit Tests Passed**: Component tests in Jest.
- **CI Pipeline**: Enhanced `.github/workflows/ci.yml` supporting feature branches and pull requests.
