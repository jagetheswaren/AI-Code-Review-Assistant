# 🚀 Deployment Guide

## Architecture Overview
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Render    │────▶│ MongoDB     │
│  (Frontend) │     │  (Backend)  │     │   Atlas     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Ollama    │
                    │  (AI Model) │
                    └─────────────┘
```

---

## 📋 Prerequisites
- GitHub account
- MongoDB Atlas account (free tier)
- Render account (free tier)
- Vercel account (free tier)
- (Optional) Ollama instance for AI - or use Render's GPU instances

---

## 1️⃣ MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com
2. Create free M0 cluster
3. Create database user: **Database Access > Add New Database User**
4. Whitelist all IPs: **Network Access > Add IP Address > Allow Access from Anywhere (0.0.0.0/0)**
5. Get connection string: **Clusters > Connect > Drivers > Copy connection string**
6. Replace `<password>` and `<dbname>` in connection string

---

## 2️⃣ Backend Deployment (Render)

### Option A: Using Render Dashboard (Recommended)

1. Go to https://dashboard.render.com
2. Click **New > Web Service**
3. Connect GitHub repo
4. Configure:
   ```
   Name: code-review-backend
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: backend
   Runtime: Docker
   ```

5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `FLASK_ENV` | `production` |
   | `MONGO_URI` | `mongodb+srv://...` (from Atlas) |
   | `JWT_SECRET` | `openssl rand -hex 32` |
   | `GITHUB_TOKEN` | `ghp_xxx` (GitHub PAT) |
   | `GITHUB_WEBHOOK_SECRET` | `openssl rand -hex 32` |
   | `OLLAMA_MODEL` | `qwen2.5-coder:3b` |
   | `OLLAMA_BASE_URL` | `https://your-ollama.com` |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` |

6. Click **Create Web Service**
7. Wait for deployment (5-10 min)
8. Note your URL: `https://code-review-backend.onrender.com`

### Option B: Using render.yaml (Infrastructure as Code)

Create `render.yaml` in repo root:
```yaml
services:
  - type: web
    name: code-review-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    region: oregon
    plan: free
    envVars:
      - key: FLASK_ENV
        value: production
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: GITHUB_TOKEN
        sync: false
      - key: GITHUB_WEBHOOK_SECRET
        generateValue: true
      - key: OLLAMA_MODEL
        value: qwen2.5-coder:3b
      - key: CORS_ORIGINS
        value: https://your-app.vercel.app
```

---

## 3️⃣ Ollama AI Model (Required for AI Explanations)

### Option A: Render GPU Instance (Easiest)
1. Create new Web Service on Render
2. Select **Docker** runtime
3. Use this Dockerfile:
   ```dockerfile
   FROM ollama/ollama:latest
   RUN ollama serve & sleep 10 && ollama pull qwen2.5-coder:3b
   ```
4. Set plan to **Starter GPU** ($10/mo) or higher
5. Set `OLLAMA_BASE_URL` in backend to this service URL

### Option B: External Ollama (Free)
- Run Ollama locally with ngrok: `ollama serve` + `ngrok http 11434`
- Use free tier on https://ollama.ai cloud (if available)
- Deploy on Railway/Render with GPU

### Option C: Disable AI (Quick Test)
Set in backend env: `OLLAMA_BASE_URL=` (empty) - AI reviews will show fallback messages

---

## 4️⃣ Frontend Deployment (Vercel)

### Option A: Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Click **Add New > Project**
3. Import GitHub repo
4. Configure:
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   ```

5. Add Environment Variable:
   | Name | Value |
   |------|-------|
   | `REACT_APP_API_URL` | `https://your-backend.onrender.com/api` |

6. Click **Deploy**
7. Note your URL: `https://your-app.vercel.app`

### Option B: Vercel CLI
```bash
cd frontend
npm install -g vercel
vercel --prod
```

### Update CORS in Backend
After getting Vercel URL, update backend `CORS_ORIGINS`:
```
CORS_ORIGINS=https://your-app.vercel.app
```
Redeploy backend.

---

## 5️⃣ GitHub Webhook Setup

1. Go to your GitHub repo
2. **Settings > Webhooks > Add webhook**
3. Configure:
   ```
   Payload URL: https://your-backend.onrender.com/api/webhook/github
   Content type: application/json
   Secret: [your GITHUB_WEBHOOK_SECRET]
   SSL verification: Enable
   Events: Pull requests (select individual events > Pull requests)
   Active: ✓
   ```
4. Click **Add webhook**
5. Test: Create a PR - you should see a comment from the bot

---

## 6️⃣ Local Development

```bash
# 1. Clone repo
git clone https://github.com/yourusername/AI-Code-Review-Assistant.git
cd AI-Code-Review-Assistant

# 2. Copy env file
cp .env.example .env
# Edit .env with your values

# 3. Start all services
docker-compose up -d

# 4. Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# 5. Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MongoDB: mongodb://localhost:27017
# Ollama: http://localhost:11434
```

### Run without Docker
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
flask run

# Frontend (new terminal)
cd frontend
npm install
npm start
```

---

## 7️⃣ Testing Checklist

- [ ] Backend health: `curl https://your-backend.onrender.com/health`
- [ ] Frontend loads: Visit Vercel URL
- [ ] Login/Register works
- [ ] Paste code → Click Analyze → See results
- [ ] Upload .py file → See results
- [ ] History page shows past scans
- [ ] Trends chart displays
- [ ] Create PR → Bot comments with review
- [ ] AI explanations appear for issues

---

## 8️⃣ Monitoring & Logs

### Render
- Logs: Dashboard > Service > Logs
- Metrics: Dashboard > Service > Metrics
- Shell: Dashboard > Service > Shell

### Vercel
- Logs: Project > Deployments > View Logs
- Analytics: Project > Analytics

### MongoDB Atlas
- Metrics: Clusters > Metrics
- Logs: Clusters > Logs

---

## 9️⃣ Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Update `CORS_ORIGINS` in backend with exact Vercel URL |
| MongoDB connection timeout | Check Atlas IP whitelist (0.0.0.0/0) |
| AI explanations missing | Verify Ollama is running and model pulled |
| GitHub webhook fails | Check webhook secret matches, check Render logs |
| Build fails on Render | Check Dockerfile syntax, ensure requirements.txt exists |
| Vercel build fails | Check `package.json` has `build` script |

---

## 💰 Cost Estimate (Monthly)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Render Backend | ✅ 750 hrs/mo | $7/mo |
| Render Ollama GPU | ❌ | $10-50/mo |
| MongoDB Atlas | ✅ 512 MB | $9/mo |
| Vercel Frontend | ✅ Unlimited | $20/mo |
| GitHub | ✅ Free | - |
| **Total** | **$0** | **$26-76/mo** |

---

## 🔐 Security Checklist

- [ ] Use strong `JWT_SECRET` (64+ chars)
- [ ] Rotate `GITHUB_TOKEN` periodically
- [ ] Enable MongoDB Atlas encryption at rest
- [ ] Use HTTPS everywhere (automatic on Render/Vercel)
- [ ] Set `FLASK_ENV=production`
- [ ] Enable GitHub webhook signature verification
- [ ] Review MongoDB Atlas network access regularly
- [ ] Set up Render/Vercel 2FA

---

## 📞 Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Ollama: https://github.com/ollama/ollama