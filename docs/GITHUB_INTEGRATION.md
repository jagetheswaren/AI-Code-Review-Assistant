# IntelliReview AI V2 — GitHub Integration Guide

## 1. Overview
IntelliReview AI V2 integrates directly with GitHub to provide:
- Repository browsing and branch analysis.
- Pull request diff scanning with line-by-line finding mapping.
- Automated webhook reviews on PR open and sync events.
- Permitted review comment publishing back to GitHub.

---

## 2. Authentication Methods

### 2.1 GitHub OAuth App (Recommended for SaaS/Production)
1. In GitHub Settings -> Developer settings -> OAuth Apps, create a new OAuth Application:
   - **Application name**: IntelliReview AI
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/api/github/oauth/callback`
2. Set environment variables:
   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_OAUTH_CALLBACK_URL=https://your-domain.com/api/github/oauth/callback
   ```
3. Frontend redirects to `/api/github/oauth/authorize`, validating a cryptographically random `state` token on return.

### 2.2 Personal Access Token (PAT)
- Users can directly input a Classic or Fine-grained Personal Access Token with `repo` scope.
- Configured via `POST /api/github/pat`.
- Token is verified against `https://api.github.com/user` before saving.

---

## 3. Webhook Integration

### 3.1 Webhook Setup
In your GitHub repository settings -> Webhooks:
- **Payload URL**: `https://your-domain.com/api/github/webhook`
- **Content type**: `application/json`
- **Secret**: Set a high-entropy secret and configure `GITHUB_WEBHOOK_SECRET` on your server.
- **Events**: Select **Pull requests** (`opened`, `synchronize`, `reopened`).

### 3.2 Security & Idempotency
- **Signature Verification**: Every incoming request must provide an `X-Hub-Signature-256` header. The server computes `hmac.new(secret, body, hashlib.sha256).hexdigest()` and verifies it with `hmac.compare_digest`.
- **Deduplication**: Each delivery has a unique `X-GitHub-Delivery` ID. Deliveries already processed within the retention window are acknowledged with HTTP 200 without re-running scans.

---

## 4. Pull Request Review Automation

### 4.1 Diff & File Parsing
- The server retrieves the PR diff from GitHub's REST API.
- Files matching supported source extensions (e.g. `.py`) are parsed.
- Findings are mapped back to patch positions so comments appear directly on the changed lines.

### 4.2 Review Publication Controls
- By default, reviews are generated and saved in the IntelliReview dashboard.
- If automated comment publishing is enabled in user settings, comments are posted via `POST /repos/{owner}/{repo}/pulls/{number}/reviews`.
- IntelliReview never attempts to auto-merge, force-push, or rewrite git history.
