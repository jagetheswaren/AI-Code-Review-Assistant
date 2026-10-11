# Database Schema Documentation

## MongoDB Collections

### users

Stores user account information and authentication credentials.

**Collection Name:** `users`

**Indexes:**
- `{email: 1}` (unique)
- `{username: 1}` (unique)

**Schema:**

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  username: String,                 // Unique username (3+ chars)
  email: String,                    // Unique email address
  password_hash: String,            // bcrypt hashed password
  created_at: ISODate,             // Account creation timestamp
  last_login: ISODate,             // Last login timestamp (nullable)
  is_active: Boolean                // Account status (default: true)
}
```

**Example:**

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  username: "john_dev",
  email: "john@example.com",
  password_hash: "$2b$12$8qWJG8RP5GyZdF.gPlRMPuQdZ5ZQk.vS.Zpl1o5Btu8KUDpM5YB3W",
  created_at: ISODate("2024-01-15T10:30:00Z"),
  last_login: ISODate("2024-01-20T15:45:00Z"),
  is_active: true
}
```

**Operations:**
- Create user during registration
- Read user by email or username during login
- Update last_login timestamp on each login
- Deactivate user (soft delete)

---

### scans

Stores code analysis results for each user scan.

**Collection Name:** `scans`

**Indexes:**
- `{user_id: 1, timestamp: -1}` (composite, sorted)
- `{request_id: 1}` (unique)

**Schema:**

```javascript
{
  _id: ObjectId,                        // Scan result ID
  user_id: ObjectId,                    // Reference to users._id
  request_id: String,                   // Unique request identifier (UUID)
  timestamp: ISODate,                   // When scan was performed
  
  file_analyses: [
    {
      file_path: String,                // Path to analyzed file
      language: String,                 // Programming language (e.g., "python")
      lines_of_code: Number,            // Total lines in file
      issues: [
        {
          type: String,                 // "security", "code_smell", "performance", "best_practice"
          severity: String,             // "critical", "high", "medium", "low", "info"
          line_number: Number,          // Line number where issue occurs
          column: Number,               // Column number (nullable)
          message: String,              // Issue description
          rule_id: String,              // Rule identifier (e.g., "B105", "C901")
          suggestion: String,           // Quick fix suggestion (nullable)
          code_snippet: String,         // Code excerpt showing the issue (nullable)
          file_path: String,            // File path (redundant for convenience)
          explanation: String,          // NLP-generated explanation
          fix_suggestion: String,       // NLP-generated fix suggestion
          ml_severity: String,          // ML-predicted severity level
          ml_confidence: Number         // ML confidence score (0.0-1.0)
        }
      ]
    }
  ],
  
  summary: {
    total_issues: Number,               // Count of all issues
    by_type: {
      security: Number,
      code_smell: Number,
      performance: Number,
      best_practice: Number
    },
    by_severity: {
      critical: Number,
      high: Number,
      medium: Number,
      low: Number,
      info: Number
    },
    overall_risk: String,               // "critical", "high", "medium", "low", "none"
    file_path: String                   // Original analyzed file path
  },
  
  ai_review: String,                    // Comprehensive AI analysis summary
  
  github_pr_url: String,                // GitHub PR URL (nullable)
  github_pr_number: Number,             // GitHub PR number (nullable)
  github_repo: String,                  // GitHub repo (user/repo) (nullable)
  
  processing_time_ms: Number            // Analysis duration in milliseconds
}
```

**Example:**

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  user_id: ObjectId("507f1f77bcf86cd799439011"),
  request_id: "550e8400-e29b-41d4-a716-446655440000",
  timestamp: ISODate("2024-01-20T15:30:00Z"),
  
  file_analyses: [
    {
      file_path: "app.py",
      language: "python",
      lines_of_code: 150,
      issues: [
        {
          type: "security",
          severity: "critical",
          line_number: 12,
          column: 1,
          message: "Hardcoded password detected",
          rule_id: "B105",
          suggestion: "Use environment variables",
          code_snippet: "password = 'admin123'",
          file_path: "app.py",
          explanation: "Hardcoded credentials are a critical security risk that could allow unauthorized access.",
          fix_suggestion: "password = os.environ.get('DB_PASSWORD')",
          ml_severity: "critical",
          ml_confidence: 0.98
        }
      ]
    }
  ],
  
  summary: {
    total_issues: 5,
    by_type: {
      security: 2,
      code_smell: 2,
      performance: 1,
      best_practice: 0
    },
    by_severity: {
      critical: 1,
      high: 1,
      medium: 2,
      low: 1,
      info: 0
    },
    overall_risk: "high",
    file_path: "app.py"
  },
  
  ai_review: "This code has several issues. The most critical is the hardcoded password...",
  
  github_pr_url: "https://github.com/user/repo/pull/123",
  github_pr_number: 123,
  github_repo: "user/repo",
  
  processing_time_ms: 1234
}
```

**Operations:**
- Insert scan result after analysis
- Query recent scans for a user
- Search by request_id
- Aggregate for statistics (count, sum, average)
- Calculate trends over time

---

### settings

Stores user preferences and configuration.

**Collection Name:** `settings`

**Indexes:**
- `{user_id: 1}` (unique)

**Schema:**

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,                    // Reference to users._id
  
  theme: String,                        // "light", "dark", "auto"
  notifications_enabled: Boolean,       // Email notifications
  auto_analyze: Boolean,                // Auto-analyze on webhook
  github_token: String,                 // Encrypted GitHub token (optional)
  
  updated_at: ISODate                   // Last settings update
}
```

**Example:**

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  user_id: ObjectId("507f1f77bcf86cd799439011"),
  theme: "dark",
  notifications_enabled: true,
  auto_analyze: true,
  github_token: "ghp_xxxxxxxxxxxx", // encrypted
  updated_at: ISODate("2024-01-20T10:00:00Z")
}
```

---

### notifications

Stores notification history for users.

**Collection Name:** `notifications`

**Indexes:**
- `{user_id: 1, created_at: -1}` (composite)

**Schema:**

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,                    // Reference to users._id
  
  type: String,                         // "success", "warning", "error", "info"
  title: String,                        // Notification title
  message: String,                      // Notification message
  related_scan_id: ObjectId,            // Reference to scans._id (nullable)
  
  is_read: Boolean,                     // Read status
  created_at: ISODate,                  // Creation timestamp
  expires_at: ISODate                   // When notification expires (nullable)
}
```

**Example:**

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  user_id: ObjectId("507f1f77bcf86cd799439011"),
  type: "warning",
  title: "High-Risk Issues Found",
  message: "Your recent code scan found 2 critical security issues.",
  related_scan_id: ObjectId("507f1f77bcf86cd799439012"),
  is_read: false,
  created_at: ISODate("2024-01-20T15:30:00Z"),
  expires_at: ISODate("2024-02-20T15:30:00Z")
}
```

---

## Index Strategies

### Performance Indexes

| Collection | Index | Type | Purpose |
|-----------|-------|------|---------|
| users | {email: 1} | unique | Fast email lookups during login |
| users | {username: 1} | unique | Prevent duplicate usernames |
| scans | {user_id: 1, timestamp: -1} | compound | Efficient history pagination |
| scans | {request_id: 1} | unique | Fast request lookup |
| settings | {user_id: 1} | unique | Quick settings retrieval |
| notifications | {user_id: 1, created_at: -1} | compound | Efficient notification queries |

### Query Optimization Tips

1. **User Login**
   ```javascript
   db.users.findOne({email: "user@example.com"})  // Uses index {email: 1}
   ```

2. **Recent Scans**
   ```javascript
   db.scans.find({user_id: ObjectId(...)})
     .sort({timestamp: -1})
     .limit(20)  // Uses index {user_id: 1, timestamp: -1}
   ```

3. **Statistics Aggregation**
   ```javascript
   db.scans.aggregate([
     {$match: {user_id: ObjectId(...)}},
     {$group: {_id: null, total: {$sum: "$summary.total_issues"}}}
   ])
   ```

4. **Scan by Request ID**
   ```javascript
   db.scans.findOne({request_id: "550e8400-..."})  // Uses index {request_id: 1}
   ```

---

## Data Retention Policy

### Suggested Retention

| Collection | Retention Period | Policy |
|-----------|-----------------|--------|
| scans | 90 days | Keep last 90 days, archive older |
| notifications | 30 days | Auto-delete after 30 days |
| settings | No expiry | Kept with user account |
| users | No expiry | Kept until account deletion |

### Archive Strategy (Future)

```javascript
// Move old scans to archive collection
db.scans.deleteMany({
  timestamp: {$lt: new Date(Date.now() - 90*24*60*60*1000)},
  archived: false
})

// Archive instead of delete
db.scans_archive.insertMany(
  db.scans.find({
    timestamp: {$lt: new Date(Date.now() - 90*24*60*60*1000)},
    archived: false
  })
)
```

---

## Backup & Recovery

### MongoDB Atlas Automated Backups

- **Frequency:** Every 6 hours
- **Retention:** 30 days
- **Recovery Point Objective (RPO):** 6 hours
- **Recovery Time Objective (RTO):** 15-30 minutes

### Manual Backup

```bash
# Export entire database
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/code_review_assistant"

# Import database
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/code_review_assistant" ./dump
```

---

## Migration Guide

### Add New Field to Collection

```javascript
// Add new field with default value
db.users.updateMany({}, {$set: {api_quota: 1000}})
```

### Rename Field

```javascript
// Rename field across collection
db.scans.updateMany({}, {$rename: {"old_field": "new_field"}})
```

### Create Index

```javascript
// Add new index
db.scans.createIndex({user_id: 1, status: 1})
```

### Remove Index

```javascript
// Drop index
db.scans.dropIndex("user_id_1_status_1")
```

---

## Monitoring & Analytics

### Collection Sizes

```javascript
// Get collection stats
db.scans.stats()

// Estimate document count
db.scans.estimatedDocumentCount()
```

### Query Performance

```javascript
// Analyze query performance
db.scans.find({user_id: ObjectId(...)}).explain("executionStats")
```

### Storage Usage

```javascript
// Check database storage
db.stats()
```

---

## Security Considerations

1. **Encryption**
   - Enable encryption at rest (MongoDB Atlas M10+)
   - Use SSL/TLS for connections
   - Encrypt sensitive fields (GitHub tokens)

2. **Access Control**
   - Create database user with minimal privileges
   - Use network access lists
   - Enable IP whitelisting

3. **Audit Logging**
   - Enable MongoDB audit logs
   - Monitor access patterns
   - Alert on suspicious activity

4. **Data Privacy**
   - Regular backups
   - GDPR compliance (user deletion)
   - Data anonymization policies
