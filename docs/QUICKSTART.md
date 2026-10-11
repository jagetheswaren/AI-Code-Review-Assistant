# Quick Start Guide

Get the AI Code Review Assistant up and running in 10 minutes!

## Prerequisites

- Git
- Docker & Docker Compose (recommended)
- OR Python 3.11+, Node.js 18+, MongoDB

---

## Option 1: Docker Compose (Recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/AI-Code-Review-Assistant.git
cd AI-Code-Review-Assistant
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set:
```env
FLASK_ENV=development
FLASK_PORT=5000
CORS_ORIGINS=http://localhost:3000
MONGO_URI=mongodb://localhost:27017
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GITHUB_TOKEN=ghp_your_token_here (optional)
GITHUB_WEBHOOK_SECRET=your_webhook_secret (optional)
```

### 3. Start All Services

```bash
docker-compose up --build
```

**Services will be available at:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

### 4. Create Test Account

1. Open http://localhost:3000
2. Click "Register"
3. Create account with:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `TestPass123!`

### 5. Test Code Analysis

1. Go to Dashboard
2. Paste this code:
```python
import os
password = 'admin123'
db.connect(password)
for i in range(1000):
    for j in range(1000):
        x = i * j
```

3. Click "Analyze Code"
4. View security issues, code smells, and performance problems

---

## Option 2: Local Development

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start MongoDB locally
# On macOS: brew install mongodb-community && brew services start mongodb-community
# On Windows: Download from https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# On Linux: sudo apt-get install -y mongodb

# Train ML model
python train_model.py

# Start Flask server
python app.py
```

Backend will be available at: http://localhost:5000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will open at: http://localhost:3000

---

## Configuration

### Backend (.env)

```env
# Flask
FLASK_ENV=development
FLASK_PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017
# Or MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/code_review_assistant

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION_HOURS=24

# CORS
CORS_ORIGINS=http://localhost:3000

# GitHub (Optional)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# AI Models
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:3b
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Available Commands

### Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Train ML model
python train_model.py

# Run tests (when implemented)
pytest

# Run with development server
python app.py

# Run with gunicorn (production)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Clean up (remove volumes)
docker-compose down -v
```

---

## API Endpoints

### Authentication

```bash
# Register
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Response includes JWT token
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {"id": "...", "username": "testuser", "email": "test@example.com"}
# }
```

### Code Analysis

```bash
# Set token (from login response)
TOKEN="your_jwt_token"

# Analyze code
curl -X POST http://localhost:5000/api/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "password = '\''admin123'\''\ndb.connect(password)",
    "filename": "app.py"
  }'
```

### Dashboard

```bash
# Get dashboard
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Get statistics
curl -X GET http://localhost:5000/api/statistics \
  -H "Authorization: Bearer $TOKEN"

# Get history
curl -X GET "http://localhost:5000/api/history?page=1&per_page=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 <PID>
```

### MongoDB Connection Error

```bash
# Check if MongoDB is running
mongosh  # Connect to MongoDB

# If using Docker Compose, MongoDB should be running automatically
docker-compose ps
```

### Module Not Found Error

```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### API Not Responding

```bash
# Check if backend is running
curl http://localhost:5000/health
# Should return: {"status": "healthy", "service": "code-review-assistant"}

# Check logs
docker-compose logs backend
```

### Authentication Failures

```bash
# Verify token is included in headers
# Authorization: Bearer {token}

# Check if JWT_SECRET matches between environments
# Ensure token hasn't expired
```

---

## Next Steps

1. **Explore the Dashboard**
   - Upload a Python file
   - View analysis results
   - Explore issue details

2. **Configure GitHub Integration**
   - Go to Settings → GitHub Integration
   - Add GitHub Personal Access Token
   - Set up webhook on your repository

3. **Review Documentation**
   - [API Documentation](./API_DOCS.md)
   - [Architecture Guide](./ARCHITECTURE.md)
   - [Database Schema](./DATABASE.md)

4. **Customize Settings**
   - Change theme (Settings page)
   - Enable/disable notifications
   - Configure auto-analysis

---

## Project Structure

```
AI-Code-Review-Assistant/
├── frontend/                 # React application
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # Auth context
│   │   ├── api/             # API client
│   │   └── App.jsx
│   └── package.json
├── backend/                  # Flask application
│   ├── analyzers/           # Code analyzers
│   ├── ml/                  # ML models
│   ├── database/            # MongoDB layer
│   ├── api/                 # API routes
│   ├── auth/                # Authentication
│   ├── services/            # GitHub client
│   ├── app.py               # Flask app
│   ├── config.py            # Configuration
│   └── requirements.txt
├── docker-compose.yml       # Docker Compose
├── .env.example            # Environment template
├── README.md               # Main documentation
├── API_DOCS.md            # API reference
├── ARCHITECTURE.md        # Architecture guide
└── DATABASE.md            # Database schema
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| FLASK_ENV | No | development | Flask environment |
| FLASK_PORT | No | 5000 | Flask server port |
| MONGO_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | JWT signing secret |
| CORS_ORIGINS | No | http://localhost:3000 | Allowed CORS origins |
| GITHUB_TOKEN | No | - | GitHub personal access token |
| GITHUB_WEBHOOK_SECRET | No | - | GitHub webhook secret |
| OLLAMA_BASE_URL | No | http://localhost:11434 | Ollama API URL |
| OLLAMA_MODEL | No | qwen2.5-coder:3b | Ollama model name |
| REACT_APP_API_URL | No | http://localhost:5000/api | Backend API URL |

---

## Support & Resources

- **Documentation:** See [README.md](./README.md)
- **API Reference:** See [API_DOCS.md](./API_DOCS.md)
- **Architecture:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Database:** See [DATABASE.md](./DATABASE.md)
- **Issues:** Open an issue on GitHub

---

## Security Reminders

⚠️ **Important:**
- Never commit `.env` file to git
- Change `JWT_SECRET` in production
- Keep `GITHUB_TOKEN` private
- Use environment-specific configurations
- Enable HTTPS in production
- Keep dependencies updated

---

**Ready to get started? Follow the steps above and start analyzing code! 🚀**
