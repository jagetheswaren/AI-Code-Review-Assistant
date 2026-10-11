# Release Checklist

## 1. Clean Install Test
- [ ] Backend: Fresh Python environment created
- [ ] Backend: `pip install -r requirements.txt` succeeds without local dependency conflicts
- [ ] Backend: Environment variables (`.env`) loaded correctly
- [ ] Backend: Database connects successfully
- [ ] Backend: Server starts on port 5000
- [ ] Frontend: `npm install` succeeds (no unmet peer dependencies)
- [ ] Frontend: `npm run build` generates optimized production bundle
- [ ] Frontend: Application serves correctly on local/production server

## 2. Environment Variable Audit (Production)

### Database
- [ ] `MONGO_URI`: Must use a production Atlas URI (not localhost)

### Authentication
- [ ] `JWT_SECRET`: Must be a strong, randomly generated string (not the default)

### Core Backend Setup
- [ ] `FLASK_ENV`: Must be `production`
- [ ] `CORS_ORIGINS`: Must be the exact deployed frontend URL (e.g., `https://frontend-delta-eight-92.vercel.app`)
- [ ] `LOG_LEVEL`: Recommended `INFO` or `WARNING`

### GitHub Integration
- [ ] `GITHUB_CLIENT_ID`: OAuth App Client ID
- [ ] `GITHUB_CLIENT_SECRET`: OAuth App Client Secret
- [ ] `GITHUB_OAUTH_CALLBACK_URL`: Must match the backend production URL (e.g., `https://api.yourdomain.com/api/github/oauth/callback`)
- [ ] `GITHUB_WEBHOOK_SECRET`: Secure string matching the GitHub App Webhook configuration

### AI Provider
- [ ] `GROQ_API_KEY`: Production API Key for Groq (or fallback `OLLAMA_BASE_URL` if self-hosting Ollama)

## 3. Production Deployment & URLs
- [ ] Frontend URL (Vercel): ___________________________
- [ ] Backend URL (Render): ___________________________
- [ ] MongoDB Atlas provisioned

## 4. Production Smoke Test (To be performed on deployed URLs)
- [ ] **Frontend**: Landing page loads, registration works, login works, responsive on mobile.
- [ ] **Backend**: Health check endpoint OK, Auth API OK, Review API OK.
- [ ] **Core Workflow**: Register -> Login -> New Review -> Analyze -> Results -> History.

## 5. Automated Tests
- [ ] Playwright E2E suites pass locally against the build.
- [ ] Python unit/integration tests pass.

## 6. Security Final Pass
- [ ] Verify rate limits (e.g. 60 requests/min on webhooks) are active.
- [ ] Verify CORS strictly rejects unknown origins.
- [ ] Verify passwords are bcrypt hashed (verified in codebase).
- [ ] Verify GitHub webhook signature validation (`X-Hub-Signature-256`) is active.

## 7. Performance Baseline (To be filled)
- Initial page load time: ____ ms
- Analysis duration (avg 100 line file): ____ ms
- GitHub PR webhook processing time: ____ ms

## 8. Final Status
- [ ] **READY FOR PUBLIC RELEASE**
