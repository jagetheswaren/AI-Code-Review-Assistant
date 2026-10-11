# IntelliReview AI V2 — Security Architecture & Policy

## 1. Security Overview
IntelliReview AI V2 is designed with a defense-in-depth posture for developer tooling. Source code submitted for analysis is treated as untrusted data and is never executed or interpreted during inspection.

## 2. Core Security Controls

### 2.1 Code Execution Prevention
- **Static Analysis Only**: Scans are performed purely via static analysis engines:
  - Python AST (`ast.parse`)
  - Astroid (`astroid.parse`)
  - Bandit AST visitor (`bandit.core`)
  - Radon complexity visitor (`radon.complexity`)
- Untrusted user code is **never run**, imported, or executed inside the application process or containers.

### 2.2 Input Validation & Payload Size Limits
- Source code uploads and pasted snippets are validated for size (`MAX_CODE_CHARS = 12000` for LLM context, `16MB` maximum upload size).
- Character encodings and file extensions are sanitized prior to processing.
- Temporary files used during multi-file scans are created with secure random names (`tempfile.NamedTemporaryFile`) and deleted upon scan completion via `finally` blocks.

### 2.3 Authentication & Authorization
- **JWT Authentication**: Passwords hashed with secure `bcrypt` salt rounds.
- **Token Security**: Tokens are signed with server-side `SECRET_KEY`, with strict expiration policies.
- **Guest Mode Isolation**: Public Instant Review allows guest users to run scans without login, assigning an ephemeral UUID. Anonymous scans cannot view other scans and can only be claimed once into an authenticated account via `POST /api/scan/<id>/claim`.
- **Tenant Isolation**: All database operations for scans, repositories, pull requests, and history enforce user ownership checks (`user_id = g.current_user["user_id"]`). Cross-user data access is rejected with HTTP 403.

### 2.4 GitHub Integration Security
- **Webhook Verification**: Every webhook payload from GitHub must present a valid `X-Hub-Signature-256` header. The server performs constant-time HMAC-SHA256 verification (`hmac.compare_digest`). Unsigned or invalid requests are rejected with HTTP 401.
- **Idempotency & Deduplication**: Webhook delivery IDs (`X-GitHub-Delivery`) are recorded to prevent replay attacks and duplicate scan executions.
- **OAuth CSRF Defense**: GitHub OAuth utilizes a cryptographically random `state` token (`secrets.token_urlsafe(32)`) persisted in user sessions and verified in callback handlers.
- **Secret Masking**: Access tokens and PATs are never returned in cleartext to the frontend or written to server logs.

### 2.5 AI & LLM Security
- **Prompt Injection Hardening**: Prompts include strict boundary delimiters and instructions instructing models to treat code comments and variable names as data, ignoring instructions embedded within analyzed source files.
- **Structured Output Validation**: LLM outputs are parsed and validated against strict Pydantic models before being presented to users or applied to code diffs.
- **Provider Disclosures**:
  - **Local Ollama**: Data remains strictly within the local environment/host.
  - **Groq / Remote Provider**: Transmits code snippets to the remote API. Requires explicit administrator configuration of `GROQ_API_KEY`.
- **Zero Hallucination Fallback**: If LLM inference fails or times out, the system falls back to authoritative static analyzer findings with clear degraded capability indicators (`ai_available: false`).

## 3. Vulnerability Reporting
To report security vulnerabilities, please contact the maintainer directly through GitHub Security Advisories or email. We commit to acknowledging receipt within 48 hours and deploying patches promptly.
