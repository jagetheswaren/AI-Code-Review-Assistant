#!/usr/bin/env pwsh
# deploy.ps1 - One-click deployment script for Windows
# Usage: ./deploy.ps1 [dev|prod]

param(
    [string]$Environment = "dev"
)

Write-Host "🚀 Deploying AI Code Review Assistant ($Environment environment)" -ForegroundColor Green

if ($Environment -eq "prod") {
    Write-Host "📦 Production deployment requires:" -ForegroundColor Yellow
    Write-Host "  1. GitHub secrets configured"
    Write-Host "  2. Render service created"
    Write-Host "  3. Vercel project linked"
    Write-Host "  4. MongoDB Atlas cluster running"
    Write-Host ""
    Write-Host "Trigger deployment by pushing to main branch:" -ForegroundColor Cyan
    Write-Host "  git add . ; git commit -m 'Deploy' ; git push origin main"
    Write-Host ""
    Write-Host "Or use the Render/Vercel dashboards directly." -ForegroundColor Cyan
} else {
    Write-Host "🐳 Starting local development stack..." -ForegroundColor Green
    docker-compose up --build -d
    Write-Host ""
    Write-Host "✅ Services started:" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:3000"
    Write-Host "  Backend:  http://localhost:5000"
    Write-Host "  MongoDB:  mongodb://localhost:27017"
    Write-Host "  Ollama:   http://localhost:11434"
    Write-Host ""
    Write-Host "📋 View logs: docker-compose logs -f"
    Write-Host "🛑 Stop:      docker-compose down"
}