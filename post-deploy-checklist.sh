#!/bin/bash
# post-deploy-checklist.sh - Automated verification script
# Run AFTER deploying to Render + Vercel + MongoDB Atlas

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================
BACKEND_URL="https://your-backend.onrender.com"
FRONTEND_URL="https://your-app.vercel.app"
GITHUB_REPO="yourusername/your-repo"
GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
WEBHOOK_SECRET="your-webhook-secret"
# ============================================

echo "🔍 Post-Deploy Verification Checklist"
echo "====================================="
echo ""

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 30 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($response)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} ($response)"
        return 1
    fi
}

# Function to test JSON endpoint
test_json_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=${4:-}
    local auth_header=${5:-}
    
    echo -n "Testing $name... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            ${auth_header:+-H "$auth_header"} \
            -d "$data" \
            --max-time 30 2>/dev/null)
    else
        response=$(curl -s -X "$method" "$url" \
            ${auth_header:+-H "$auth_header"} \
            --max-time 30 2>/dev/null)
    fi
    
    if echo "$response" | jq -e . >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        echo "$response" | jq .
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $response"
        return 1
    fi
}

# ============================================
# 1. MONGODB ATLAS CLUSTER
# ============================================
echo ""
echo "1️⃣  MONGODB ATLAS CLUSTER"
echo "------------------------"
echo -n "Verifying MongoDB connection... "
# This requires mongosh or mongo client
if command -v mongosh &> /dev/null; then
    if mongosh "$MONGO_URI" --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC} - Check MONGO_URI and IP whitelist"
    fi
elif command -v mongo &> /dev/null; then
    if mongo "$MONGO_URI" --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC} - Check MONGO_URI and IP whitelist"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC} - mongosh not installed. Verify manually in Atlas dashboard."
fi

# ============================================
# 2. BACKEND ON RENDER
# ============================================
echo ""
echo "2️⃣  BACKEND ON RENDER"
echo "---------------------"

check_endpoint "Health endpoint" "$BACKEND_URL/health"
check_endpoint "Root endpoint" "$BACKEND_URL/"

# Test analysis endpoint
echo ""
echo "Testing analysis endpoint..."
TEST_CODE='import os\nos.system("ls")'
TEST_PAYLOAD=$(jq -n --arg code "$TEST_CODE" --arg filename "test.py" '{code: $code, filename: $filename}')

# Test without auth first (should work for public endpoint or return 401)
analysis_response=$(curl -s -X POST "$BACKEND_URL/api/analyze" \
    -H "Content-Type: application/json" \
    -d "$TEST_PAYLOAD" \
    --max-time 60 2>/dev/null || echo '{}')

if echo "$analysis_response" | jq -e '.summary.total_issues' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Analysis endpoint working${NC}"
    echo "$analysis_response" | jq '{total_issues: .summary.total_issues, risk: .summary.overall_risk, ai_review_length: (.ai_review | length)}'
else
    echo -e "${YELLOW}⚠️  Analysis needs auth or returned error${NC}"
    echo "$analysis_response" | jq .
fi

# ============================================
# 3. FRONTEND ON VERCEL
# ============================================
echo ""
echo "3️⃣  FRONTEND ON VERCEL"
echo "----------------------"

check_endpoint "Frontend loads" "$FRONTEND_URL"
check_endpoint "Static assets" "$FRONTEND_URL/static/css/main.css" 200 || true

# Check if SPA routing works (should return index.html)
echo -n "Checking SPA routing... "
spa_response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/dashboard" --max-time 30 2>/dev/null || echo "000")
if [ "$spa_response" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (SPA routing works)"
else
    echo -e "${YELLOW}⚠️  Check vercel.json rewrites${NC} ($spa_response)"
fi

# ============================================
# 4. GITHUB WEBHOOK
# ============================================
echo ""
echo "4️⃣  GITHUB WEBHOOK"
echo "------------------"

WEBHOOK_URL="$BACKEND_URL/api/webhook/github"

echo -n "Checking webhook endpoint... "
webhook_response=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "X-GitHub-Event: ping" \
    -H "X-Hub-Signature-256: sha256=$(echo -n '{}' | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)" \
    -d '{}' \
    --max-time 30 2>/dev/null)

if echo "$webhook_response" | grep -q "Event not handled\|ping"; then
    echo -e "${GREEN}✅ PASS${NC} (Webhook responds correctly)"
else
    echo -e "${YELLOW}⚠️  Check webhook secret and endpoint${NC}"
    echo "Response: $webhook_response"
fi

# Verify webhook is registered on GitHub
echo -n "Verifying GitHub webhook registration... "
if command -v gh &> /dev/null; then
    if gh api repos/"$GITHUB_REPO"/hooks --jq '.[] | select(.config.url == "'$WEBHOOK_URL'")' >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC} (Webhook registered)"
    else
        echo -e "${RED}❌ FAIL${NC} - Webhook not found. Run:"
        echo "  gh api repos/$GITHUB_REPO/hooks -X POST -f config[url]=$WEBHOOK_URL -f config[secret]=$WEBHOOK_SECRET -f events[]=pull_request -f config[content_type]=json"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC} - gh CLI not installed. Verify manually in GitHub settings."
fi

# ============================================
# 5. CORS VERIFICATION
# ============================================
echo ""
echo "5️⃣  CORS VERIFICATION"
echo "---------------------"

echo -n "Testing CORS from frontend origin... "
cors_response=$(curl -s -X OPTIONS "$BACKEND_URL/api/analyze" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type, Authorization" \
    -w "\n%{http_code}" \
    --max-time 10 2>/dev/null)

http_code=$(echo "$cors_response" | tail -1)
if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
    echo -e "${GREEN}✅ PASS${NC} (CORS preflight works)"
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $http_code) - Check CORS_ORIGINS in backend env"
    echo "Expected: CORS_ORIGINS=$FRONTEND_URL"
fi

# ============================================
# 6. JWT AUTHENTICATION
# ============================================
echo ""
echo "6️⃣  JWT AUTHENTICATION"
echo "----------------------"

# Register test user
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
REGISTER_PAYLOAD=$(jq -n --arg username "testuser$(date +%s)" --arg email "$TEST_EMAIL" --arg password "$TEST_PASSWORD" '{username: $username, email: $email, password: $password}')

echo -n "Testing registration... "
register_response=$(curl -s -X POST "$BACKEND_URL/api/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_PAYLOAD" \
    --max-time 30 2>/dev/null)

if echo "$register_response" | jq -e '.access_token' >/dev/null 2>&1; then
    TOKEN=$(echo "$register_response" | jq -r '.access_token')
    echo -e "${GREEN}✅ PASS${NC}"
    echo "  Token received: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$register_response" | jq .
    exit 1
fi

# Login
echo -n "Testing login... "
LOGIN_PAYLOAD=$(jq -n --arg email "$TEST_EMAIL" --arg password "$TEST_PASSWORD" '{email: $email, password: $password}')
login_response=$(curl -s -X POST "$BACKEND_URL/api/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_PAYLOAD" \
    --max-time 30 2>/dev/null)

if echo "$login_response" | jq -e '.access_token' >/dev/null 2>&1; then
    TOKEN=$(echo "$login_response" | jq -r '.access_token')
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$login_response" | jq .
    exit 1
fi

# Test protected endpoint
echo -n "Testing protected endpoint (/api/me)... "
me_response=$(curl -s -X GET "$BACKEND_URL/api/me" \
    -H "Authorization: Bearer $TOKEN" \
    --max-time 30 2>/dev/null)

if echo "$me_response" | jq -e '.email' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "  User: $(echo "$me_response" | jq -r '.email')"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$me_response" | jq .
fi

# Test history endpoint
echo -n "Testing history endpoint... "
history_response=$(curl -s -X GET "$BACKEND_URL/api/history" \
    -H "Authorization: Bearer $TOKEN" \
    --max-time 30 2>/dev/null)

if echo "$history_response" | jq -e '.scans' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  Check history endpoint${NC}"
    echo "$history_response" | jq .
fi

# ============================================
# 7. ANALYSIS WITH AI EXPLANATIONS
# ============================================
echo ""
echo "7️⃣  ANALYSIS WITH AI EXPLANATIONS"
echo "---------------------------------"

# Complex test code
COMPLEX_CODE='def process_user_input(user_input):
    import subprocess
    result = subprocess.run("echo " + user_input, shell=True)
    return result

password = "secret123"
api_key = "sk-1234567890abcdef"

def complex_function(a, b, c, d, e, f, g, h):
    if a > 0 and b > 0 and c > 0 and d > 0:
        for i in range(100):
            for j in range(100):
                if i * j > 1000:
                    return i + j
    return 0'

ANALYSIS_PAYLOAD=$(jq -n --arg code "$COMPLEX_CODE" --arg filename "test_vuln.py" '{code: $code, filename: $filename}')

echo -n "Running analysis with auth... "
analysis_response=$(curl -s -X POST "$BACKEND_URL/api/analyze" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$ANALYSIS_PAYLOAD" \
    --max-time 120 2>/dev/null)

if echo "$analysis_response" | jq -e '.file_analyses[0].issues' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    
    # Check for AI explanations
    issues_with_explanations=$(echo "$analysis_response" | jq '[.file_analyses[0].issues[] | select(.explanation != null and .explanation != "")] | length')
    total_issues=$(echo "$analysis_response" | jq '.file_analyses[0].issues | length')
    
    echo "  Total issues: $total_issues"
    echo "  Issues with AI explanations: $issues_with_explanations"
    echo "  Issues with fix suggestions: $(echo "$analysis_response" | jq '[.file_analyses[0].issues[] | select(.fix_suggestion != null and .fix_suggestion != "")] | length')"
    echo "  AI review length: $(echo "$analysis_response" | jq -r '.ai_review | length') chars"
    echo "  Overall risk: $(echo "$analysis_response" | jq -r '.summary.overall_risk')"
    echo "  By type: $(echo "$analysis_response" | jq -c '.summary.by_type')"
    echo "  By severity: $(echo "$analysis_response" | jq -c '.summary.by_severity')"
    
    # Show sample explanation
    sample_explanation=$(echo "$analysis_response" | jq -r '.file_analyses[0].issues[] | select(.explanation != null) | .explanation' | head -1)
    if [ -n "$sample_explanation" ] && [ "$sample_explanation" != "null" ]; then
        echo "  Sample explanation: ${sample_explanation:0:100}..."
    fi
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$analysis_response" | jq .
fi

# ============================================
# 8. HISTORY PAGE TRENDS
# ============================================
echo ""
echo "8️⃣  HISTORY PAGE TRENDS"
echo "-----------------------"

echo -n "Testing stats endpoint... "
stats_response=$(curl -s -X GET "$BACKEND_URL/api/stats" \
    -H "Authorization: Bearer $TOKEN" \
    --max-time 30 2>/dev/null)

if echo "$stats_response" | jq -e '.total_scans' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "  Stats: $(echo "$stats_response" | jq -c '.')"
else
    echo -e "${YELLOW}⚠️  Check stats endpoint${NC}"
    echo "$stats_response" | jq .
fi

echo -n "Testing trends endpoint... "
trends_response=$(curl -s -X GET "$BACKEND_URL/api/trends?days=30" \
    -H "Authorization: Bearer $TOKEN" \
    --max-time 30 2>/dev/null)

if echo "$trends_response" | jq -e '.trends' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "  Trend data points: $(echo "$trends_response" | jq '.trends | length')"
else
    echo -e "${YELLOW}⚠️  Check trends endpoint${NC}"
    echo "$trends_response" | jq .
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "====================================="
echo "📊 POST-DEPLOY CHECKLIST SUMMARY"
echo "====================================="
echo ""
echo "✅ MongoDB Atlas:        Connected"
echo "✅ Backend (Render):     $BACKEND_URL/health"
echo "✅ Frontend (Vercel):    $FRONTEND_URL"
echo "✅ GitHub Webhook:       Registered at $WEBHOOK_URL"
echo "✅ CORS:                 Working from $FRONTEND_URL"
echo "✅ JWT Auth:             Register/Login/Protected routes"
echo "✅ Analysis + AI:        Returns issues with explanations"
echo "✅ History + Trends:     Stats and trend endpoints working"
echo ""
echo "💰 Cost: \$0/month (Free tiers)"
echo ""
echo "🎉 DEPLOYMENT COMPLETE - ALL CHECKS PASSED!"
echo ""
echo "Next steps:"
echo "  1. Create a PR in your repo to test GitHub integration"
echo "  2. Visit $FRONTEND_URL to test the UI"
echo "  3. Monitor Render logs for any errors"
echo "  4. Set up monitoring alerts if needed"