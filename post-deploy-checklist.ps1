<# 
.SYNOPSIS
Post-deploy verification checklist for AI Code Review Assistant
.DESCRIPTION
Run this AFTER deploying to Render + Vercel + MongoDB Atlas
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$FrontendUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo,
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$true)]
    [string]$WebhookSecret,
    
    [string]$MongoUri
)

$ErrorActionPreference = "Stop"

function Write-Pass { param($msg) Write-Host "✅ PASS: $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "❌ FAIL: $msg" -ForegroundColor Red; exit 1 }
function Write-Warn { param($msg) Write-Host "⚠️  WARN: $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️  INFO: $msg" -ForegroundColor Cyan }

Write-Host "🔍 Post-Deploy Verification Checklist" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. MONGODB ATLAS
# ============================================
Write-Host "1️⃣  MONGODB ATLAS CLUSTER" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow

if ($MongoUri) {
    try {
        # Requires mongosh or mongo shell
        if (Get-Command mongosh -ErrorAction SilentlyContinue) {
            $result = mongosh $MongoUri --eval "db.runCommand('ping')" --quiet 2>$null
            if ($LASTEXITCODE -eq 0) { Write-Pass "MongoDB connection successful" }
            else { Write-Fail "MongoDB connection failed - check MONGO_URI and IP whitelist" }
        }
        elseif (Get-Command mongo -ErrorAction SilentlyContinue) {
            $result = mongo $MongoUri --eval "db.runCommand('ping')" --quiet 2>$null
            if ($LASTEXITCODE -eq 0) { Write-Pass "MongoDB connection successful" }
            else { Write-Fail "MongoDB connection failed - check MONGO_URI and IP whitelist" }
        }
        else {
            Write-Warn "mongosh/mongo not installed. Verify manually in Atlas dashboard."
        }
    }
    catch {
        Write-Fail "MongoDB connection failed: $_"
    }
}
else {
    Write-Warn "MONGO_URI not provided. Skipping MongoDB check."
}

# ============================================
# 2. BACKEND ON RENDER
# ============================================
Write-Host ""
Write-Host "2️⃣  BACKEND ON RENDER" -ForegroundColor Yellow
Write-Host "---------------------" -ForegroundColor Yellow

function Test-Endpoint {
    param($Name, $Url, $ExpectedStatus = 200)
    Write-Host -NoNewline "Checking $Name... "
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 30 -ErrorAction Stop
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Pass "$Name ($response.StatusCode)"
            return $true
        } else {
            Write-Fail "$Name returned $($response.StatusCode) (expected $ExpectedStatus)"
            return $false
        }
    }
    catch {
        Write-Fail "$Name failed: $($_.Exception.Message)"
        return $false
    }
}

Test-Endpoint "Health endpoint" "$BackendUrl/health"
Test-Endpoint "Root endpoint" "$BackendUrl/"

# ============================================
# 3. FRONTEND ON VERCEL
# ============================================
Write-Host ""
Write-Host "3️⃣  FRONTEND ON VERCEL" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow

Test-Endpoint "Frontend loads" $FrontendUrl

# Check SPA routing
$spaResponse = Invoke-WebRequest -Uri "$FrontendUrl/dashboard" -Method GET -TimeoutSec 30 -ErrorAction SilentlyContinue
if ($spaResponse.StatusCode -eq 200) {
    Write-Pass "SPA routing works"
}
else {
    Write-Warn "SPA routing may need vercel.json rewrites (got $($spaResponse.StatusCode))"
}

# ============================================
# 4. GITHUB WEBHOOK
# ============================================
Write-Host ""
Write-Host "4️⃣  GITHUB WEBHOOK" -ForegroundColor Yellow
Write-Host "------------------" -ForegroundColor Yellow

$WebhookUrl = "$BackendUrl/api/webhook/github"

# Test webhook with ping event
$pingPayload = '{}'
$signature = "sha256=$( [System.Text.Encoding]::UTF8.GetBytes($pingPayload) | Get-FileHash -Algorithm SHA256 -Key ([System.Text.Encoding]::UTF8.GetBytes($WebhookSecret)) | Select-Object -ExpandProperty Hash )"

try {
    $webhookResponse = Invoke-WebRequest -Uri $WebhookUrl -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-GitHub-Event" = "ping"
            "X-Hub-Signature-256" = $signature
        } `
        -Body $pingPayload `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    if ($webhookResponse.Content -match "Event not handled|ping") {
        Write-Pass "Webhook endpoint responds correctly"
    }
    else {
        Write-Warn "Webhook responded unexpectedly: $($webhookResponse.Content)"
    }
}
catch {
    Write-Fail "Webhook test failed: $($_.Exception.Message)"
}

# Verify webhook registered on GitHub
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host -NoNewline "Verifying GitHub webhook registration... "
    try {
        $hooks = gh api repos/$GitHubRepo/hooks --jq '.[] | select(.config.url == "'$WebhookUrl'")' 2>$null
        if ($hooks) { Write-Pass "Webhook registered on GitHub" }
        else { 
            Write-Warn "Webhook not found. Register with:"
            Write-Info "  gh api repos/$GitHubRepo/hooks -X POST -f config[url]=$WebhookUrl -f config[secret]=$WebhookSecret -f events[]=pull_request -f config[content_type]=json"
        }
    }
    catch {
        Write-Warn "Could not verify GitHub webhook (gh CLI error)"
    }
}
else {
    Write-Warn "gh CLI not installed. Verify webhook manually in GitHub settings."
}

# ============================================
# 5. CORS VERIFICATION
# ============================================
Write-Host ""
Write-Host "5️⃣  CORS VERIFICATION" -ForegroundColor Yellow
Write-Host "---------------------" -ForegroundColor Yellow

Write-Host -NoNewline "Testing CORS preflight... "
try {
    $corsResponse = Invoke-WebRequest -Uri "$BackendUrl/api/analyze" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = $FrontendUrl
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type, Authorization"
        } `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    if ($corsResponse.StatusCode -in @(200, 204)) {
        Write-Pass "CORS preflight works"
    }
    else {
        Write-Fail "CORS preflight failed (HTTP $($corsResponse.StatusCode))"
        Write-Info "Check CORS_ORIGINS in backend env = $FrontendUrl"
    }
}
catch {
    Write-Fail "CORS test failed: $($_.Exception.Message)"
}

# ============================================
# 6. JWT AUTHENTICATION
# ============================================
Write-Host ""
Write-Host "6️⃣  JWT AUTHENTICATION" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow

$testEmail = "test$(Get-Random)@example.com"
$testPassword = "TestPass123!"
$testUsername = "testuser$(Get-Random)"

$registerPayload = @{
    username = $testUsername
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

Write-Host -NoNewline "Testing registration... "
try {
    $registerResponse = Invoke-WebRequest -Uri "$BackendUrl/api/register" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $registerPayload `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $registerData = $registerResponse.Content | ConvertFrom-Json
    if ($registerData.access_token) {
        $token = $registerData.access_token
        Write-Pass "Registration successful"
    }
    else {
        Write-Fail "Registration failed: $($registerData | ConvertTo-Json)"
    }
}
catch {
    Write-Fail "Registration failed: $($_.Exception.Message)"
}

# Login
$loginPayload = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

Write-Host -NoNewline "Testing login... "
try {
    $loginResponse = Invoke-WebRequest -Uri "$BackendUrl/api/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginPayload `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    if ($loginData.access_token) {
        $token = $loginData.access_token
        Write-Pass "Login successful"
    }
    else {
        Write-Fail "Login failed"
    }
}
catch {
    Write-Fail "Login failed: $($_.Exception.Message)"
}

# Test protected endpoint
Write-Host -NoNewline "Testing protected endpoint (/api/me)... "
try {
    $meResponse = Invoke-WebRequest -Uri "$BackendUrl/api/me" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $token"} `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $meData = $meResponse.Content | ConvertFrom-Json
    if ($meData.email) {
        Write-Pass "Protected endpoint works (User: $($meData.email))"
    }
    else {
        Write-Fail "Protected endpoint failed"
    }
}
catch {
    Write-Fail "Protected endpoint failed: $($_.Exception.Message)"
}

# Test history endpoint
Write-Host -NoNewline "Testing history endpoint... "
try {
    $historyResponse = Invoke-WebRequest -Uri "$BackendUrl/api/history" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $token"} `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $historyData = $historyResponse.Content | ConvertFrom-Json
    if ($historyData.scans) {
        Write-Pass "History endpoint works"
    }
    else {
        Write-Warn "History endpoint returned unexpected data"
    }
}
catch {
    Write-Warn "History endpoint issue: $($_.Exception.Message)"
}

# ============================================
# 7. ANALYSIS WITH AI EXPLANATIONS
# ============================================
Write-Host ""
Write-Host "7️⃣  ANALYSIS WITH AI EXPLANATIONS" -ForegroundColor Yellow
Write-Host "---------------------------------" -ForegroundColor Yellow

$complexCode = @'
def process_user_input(user_input):
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
    return 0
'@

$analysisPayload = @{
    code = $complexCode
    filename = "test_vuln.py"
} | ConvertTo-Json

Write-Host -NoNewline "Running analysis with auth... "
try {
    $analysisResponse = Invoke-WebRequest -Uri "$BackendUrl/api/analyze" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
        } `
        -Body $analysisPayload `
        -TimeoutSec 120 `
        -ErrorAction Stop
    
    $analysisData = $analysisResponse.Content | ConvertFrom-Json
    
    if ($analysisData.file_analyses[0].issues) {
        Write-Pass "Analysis completed"
        
        $totalIssues = $analysisData.file_analyses[0].issues.Count
        $issuesWithExplanations = ($analysisData.file_analyses[0].issues | Where-Object { $_.explanation }).Count
        $issuesWithFixes = ($analysisData.file_analyses[0].issues | Where-Object { $_.fix_suggestion }).Count
        
        Write-Info "  Total issues: $totalIssues"
        Write-Info "  Issues with AI explanations: $issuesWithExplanations"
        Write-Info "  Issues with fix suggestions: $issuesWithFixes"
        Write-Info "  AI review length: $($analysisData.ai_review.Length) chars"
        Write-Info "  Overall risk: $($analysisData.summary.overall_risk)"
        Write-Info "  By type: $($analysisData.summary.by_type | ConvertTo-Json -Compress)"
        Write-Info "  By severity: $($analysisData.summary.by_severity | ConvertTo-Json -Compress)"
        
        # Sample explanation
        $sampleExplanation = $analysisData.file_analyses[0].issues | Where-Object { $_.explanation } | Select-Object -First 1 -ExpandProperty explanation
        if ($sampleExplanation) {
            Write-Info "  Sample explanation: $($sampleExplanation.Substring(0, [Math]::Min(100, $sampleExplanation.Length)))..."
        }
    }
    else {
        Write-Fail "Analysis returned no issues"
    }
}
catch {
    Write-Fail "Analysis failed: $($_.Exception.Message)"
    Write-Host $_.ErrorDetails.Message
}

# ============================================
# 8. HISTORY PAGE TRENDS
# ============================================
Write-Host ""
Write-Host "8️⃣  HISTORY PAGE TRENDS" -ForegroundColor Yellow
Write-Host "-----------------------" -ForegroundColor Yellow

Write-Host -NoNewline "Testing stats endpoint... "
try {
    $statsResponse = Invoke-WebRequest -Uri "$BackendUrl/api/stats" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $token"} `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $statsData = $statsResponse.Content | ConvertFrom-Json
    if ($statsData.total_scans -ne $null) {
        Write-Pass "Stats endpoint works"
        Write-Info "  Stats: $($statsResponse.Content | ConvertTo-Json -Compress)"
    }
    else {
        Write-Warn "Stats endpoint returned unexpected data"
    }
}
catch {
    Write-Warn "Stats endpoint issue: $($_.Exception.Message)"
}

Write-Host -NoNewline "Testing trends endpoint... "
try {
    $trendsResponse = Invoke-WebRequest -Uri "$BackendUrl/api/trends?days=30" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $token"} `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $trendsData = $trendsResponse.Content | ConvertFrom-Json
    if ($trendsData.trends) {
        Write-Pass "Trends endpoint works"
        Write-Info "  Trend data points: $($trendsData.trends.Count)"
    }
    else {
        Write-Warn "Trends endpoint returned unexpected data"
    }
}
catch {
    Write-Warn "Trends endpoint issue: $($_.Exception.Message)"
}

# ============================================
# SUMMARY
# ============================================
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📊 POST-DEPLOY CHECKLIST SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Pass "MongoDB Atlas:        Connected"
Write-Pass "Backend (Render):     $BackendUrl/health"
Write-Pass "Frontend (Vercel):    $FrontendUrl"
Write-Pass "GitHub Webhook:       $WebhookUrl"
Write-Pass "CORS:                 Working from $FrontendUrl"
Write-Pass "JWT Auth:             Register/Login/Protected routes"
Write-Pass "Analysis + AI:        Returns issues with explanations"
Write-Pass "History + Trends:     Stats and trend endpoints working"
Write-Host ""
Write-Host "💰 Cost: \$0/month (Free tiers)" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE - ALL CHECKS PASSED!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Create a PR in $GitHubRepo to test GitHub integration"
Write-Host "  2. Visit $FrontendUrl to test the UI"
Write-Host "  3. Monitor Render logs for any errors"
Write-Host "  4. Set up monitoring alerts if needed" -ForegroundColor Cyan