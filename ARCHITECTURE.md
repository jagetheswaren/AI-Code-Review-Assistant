# Architecture Documentation

## System Overview

The AI Code Review Assistant is a full-stack web application that provides automated code review capabilities using machine learning and static analysis. The architecture follows a modern microservices-inspired pattern with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                            │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────────┐  │
│  │Dashboard │ History  │ Profile  │Settings  │GitHubIntegration │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────────────┘  │
│  ┌──────────────────────────────────────┐                          │
│  │  API Client (Axios) + Auth Context   │                          │
│  └──────────────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend (Flask + Python)                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Flask Application                           │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │              API Routes                                  │ │ │
│  │  │  • /api/analyze      - Code analysis                     │ │ │
│  │  │  • /api/register     - User registration                 │ │ │
│  │  │  • /api/login        - User authentication               │ │ │
│  │  │  • /api/history      - Scan history                      │ │ │
│  │  │  • /api/dashboard    - User dashboard                    │ │ │
│  │  │  • /webhook/github   - GitHub webhook handler            │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │            Core Analysis Modules                         │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ Security Analyzer (Bandit + Custom AST)            │ │  │ │
│  │  │  │  • Hardcoded secrets                               │ │  │ │
│  │  │  │  • SQL injection patterns                          │ │  │ │
│  │  │  │  • Command injection                               │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ Smell Analyzer (Pylint + Astroid)                  │ │  │ │
│  │  │  │  • Unused variables                                │ │  │ │
│  │  │  │  • Long functions                                  │ │  │ │
│  │  │  │  • Complex conditionals                            │ │  │ │
│  │  │  │  • Naming violations                               │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ Complexity Analyzer (Radon)                        │ │  │ │
│  │  │  │  • Cyclomatic complexity                           │ │  │ │
│  │  │  │  • Maintainability index                           │ │  │ │
│  │  │  │  • Halstead metrics                                │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │            ML & NLP Enhancement                         │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ Severity Classifier (Random Forest)                │ │  │ │
│  │  │  │  • Feature extraction from issues                  │ │  │ │
│  │  │  │  • Severity level prediction                       │ │  │ │
│  │  │  │  • Confidence scoring                              │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ NLP Explainer (CodeGPT)                            │ │  │ │
│  │  │  │  • Issue explanation generation                    │ │  │ │
│  │  │  │  • Fix suggestion generation                       │ │  │ │
│  │  │  │  • Fallback explanations                           │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │          GitHub Integration                            │  │ │
│  │  │  • Webhook handler                                      │  │ │
│  │  │  • PR comment posting                                   │  │ │
│  │  │  • File download & analysis                             │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │          Authentication & Authorization                 │  │ │
│  │  │  • JWT token generation/validation                      │  │ │
│  │  │  • bcrypt password hashing                              │  │ │
│  │  │  • Protected route middleware                           │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                            ↓ MongoDB Protocol
┌─────────────────────────────────────────────────────────────────────┐
│                  MongoDB Atlas Database                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Collections:                                                 │  │
│  │  • users         - User accounts & credentials              │  │
│  │  • scans         - Code analysis results                    │  │
│  │  • settings      - User preferences                         │  │
│  │  • notifications - Notification history                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

                    ↓ GitHub REST API
                    ↓ Webhook Events
┌─────────────────────────────────────────────────────────────────────┐
│                      GitHub                                         │
│  • Repository access                                               │
│  • Pull request analysis                                           │
│  • Webhook events                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend (React)

**Technology:**
- React 19
- React Router 7
- Tailwind CSS
- Axios (HTTP Client)
- Chart.js (Visualization)

**Key Components:**
- `App.jsx` - Main app shell with routing
- `Dashboard.jsx` - Code input and analysis interface
- `History.jsx` - Scan history with pagination
- `HistoryDetail.jsx` - Detailed scan results
- `Profile.jsx` - User profile and statistics
- `Settings.jsx` - User preferences
- `GitHubIntegration.jsx` - GitHub setup guide

**Contexts:**
- `AuthContext` - User authentication state

**API Client:**
- `client.js` - Axios instance with interceptors

---

### 2. Backend (Flask)

**Technology:**
- Flask 3.0
- Python 3.11+
- MongoDB + PyMongo
- JWT for authentication
- bcrypt for password hashing

**Core Modules:**

#### API Routes (`api/`)
- `auth_routes.py` - Register, login, token refresh
- `review_routes.py` - Code analysis endpoints

#### Analyzers (`analyzers/`)
- `security_analyzer.py` - Bandit + custom AST analysis
- `smell_analyzer.py` - Pylint/astroid code quality checks
- `complexity_analyzer.py` - Radon complexity metrics

#### ML/NLP (`ml/`)
- `severity_classifier.py` - Random Forest severity prediction
- `nlp_explainer.py` - CodeGPT explanation generation

#### Database (`database/`)
- `mongodb.py` - MongoDB connection & services
  - `UserService` - User CRUD operations
  - `ScanService` - Scan history management

#### Services (`services/`)
- `github_client.py` - GitHub REST API client

#### Reviewer (`reviewer/`)
- `ai_reviewer.py` - Analysis result enhancement
- `aggregator.py` - Finding deduplication
- `github_commenter.py` - PR comment formatting

#### Authentication (`auth/`)
- `jwt_auth.py` - JWT token handling

---

### 3. Database (MongoDB)

**Collections:**

#### users
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password_hash: String,
  created_at: Date,
  last_login: Date,
  is_active: Boolean
}
```

#### scans
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  request_id: String (unique),
  timestamp: Date,
  file_analyses: [
    {
      file_path: String,
      language: String,
      lines_of_code: Number,
      issues: [
        {
          type: String,
          severity: String,
          line_number: Number,
          message: String,
          rule_id: String,
          explanation: String,
          fix_suggestion: String,
          ml_severity: String,
          ml_confidence: Number
        }
      ]
    }
  ],
  summary: {
    total_issues: Number,
    by_type: Object,
    by_severity: Object,
    overall_risk: String,
    file_path: String
  },
  ai_review: String,
  github_pr_url: String,
  github_pr_number: Number,
  github_repo: String,
  processing_time_ms: Number
}
```

---

## Data Flow

### Code Analysis Flow

```
1. User Input
   ↓
2. Frontend: Send code → Backend /api/analyze
   ↓
3. Backend: Authenticate user (JWT)
   ↓
4. Security Analysis (Bandit)
   ↓
5. Code Smell Detection (Pylint/Astroid)
   ↓
6. Complexity Analysis (Radon)
   ↓
7. ML Severity Classification
   ↓
8. NLP Explanation Generation
   ↓
9. Result Aggregation & Deduplication
   ↓
10. Save to MongoDB
   ↓
11. Return to Frontend
   ↓
12. Frontend: Display results with visualizations
```

### GitHub Webhook Flow

```
1. Developer creates/updates Pull Request
   ↓
2. GitHub sends webhook event
   ↓
3. Backend receives webhook (signature verification)
   ↓
4. Fetch PR files from GitHub
   ↓
5. Analyze each Python file
   ↓
6. Generate comments
   ↓
7. Post PR review comments on GitHub
   ↓
8. Save results to MongoDB
```

---

## Security Measures

1. **Authentication**
   - JWT tokens with expiration
   - Bcrypt password hashing
   - Protected routes with middleware

2. **API Security**
   - CORS enabled for trusted origins
   - Request validation and sanitization
   - GitHub webhook signature verification

3. **Database Security**
   - MongoDB Atlas with SSL/TLS
   - Unique indexes on sensitive fields
   - User data isolation

4. **Code Analysis**
   - AST-based analysis (safe)
   - No code execution
   - Sandboxed analysis environment

---

## Deployment Architecture

### Frontend (Vercel)
- Git-based CI/CD
- Automatic deployments on push
- Global CDN distribution
- Environment variables for API URL

### Backend (Render)
- Docker-based deployment
- Automatic builds from GitHub
- Environment variables for secrets
- PostgreSQL-ready (if needed)

### Database (MongoDB Atlas)
- Free M0 tier for development
- Paid tiers for production
- Automatic backups
- Network access controls

---

## Performance Considerations

1. **Code Analysis**
   - Parallel analysis of multiple files
   - ML model caching
   - NLP explanation caching

2. **Database Queries**
   - Indexed user_id + timestamp for history
   - Request_id index for lookups
   - Pagination for large result sets

3. **Frontend Optimization**
   - Code splitting with React Router
   - Lazy loading of charts
   - CSS-in-JS for optimized styling

---

## Scalability

1. **Horizontal Scaling**
   - Stateless Flask app (multiple instances)
   - Load balancer (Render, AWS ELB)
   - MongoDB scaling with sharding

2. **Caching**
   - Redis for ML model caching (future)
   - Browser caching for static assets
   - API response caching

3. **Queue System** (Future)
   - Celery for background analysis jobs
   - RabbitMQ for message queue
   - Async webhook processing

---

## Monitoring & Logging

1. **Application Logging**
   - Python logging to file/console
   - Frontend error logging (Sentry integration)
   - Request/response logging

2. **Database Monitoring**
   - MongoDB Atlas monitoring
   - Query performance metrics
   - Storage usage tracking

3. **Deployment Monitoring**
   - Render deployment logs
   - Vercel build logs
   - GitHub Actions CI/CD logs

---

## Future Enhancements

1. **Additional Languages**
   - JavaScript/TypeScript analysis
   - Java analysis
   - Go analysis

2. **Advanced ML**
   - Custom model training on user data
   - Anomaly detection
   - Predictive analytics

3. **Team Features**
   - Team workspaces
   - Shared analysis policies
   - Role-based access control

4. **Integration Ecosystem**
   - Slack notifications
   - VS Code extension
   - GitLab support
   - Bitbucket support
