#!/bin/bash
# deploy.sh - One-click deployment script
# Usage: ./deploy.sh [dev|prod]

set -e

ENV=${1:-dev}

echo "🚀 Deploying AI Code Review Assistant ($ENV environment)"

if [ "$ENV" = "prod" ]; then
    echo "📦 Production deployment requires:"
    echo "  1. GitHub secrets configured"
    echo "  2. Render service created"
    echo "  3. Vercel project linked"
    echo "  4. MongoDB Atlas cluster running"
    echo ""
    echo "Trigger deployment by pushing to main branch:"
    echo "  git add . && git commit -m 'Deploy' && git push origin main"
    echo ""
    echo "Or use the Render/Vercel dashboards directly."
else
    echo "🐳 Starting local development stack..."
    docker-compose up --build -d
    echo ""
    echo "✅ Services started:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:5000"
    echo "  MongoDB:  mongodb://localhost:27017"
    echo "  Ollama:   http://localhost:11434"
    echo ""
    echo "📋 View logs: docker-compose logs -f"
    echo "🛑 Stop:      docker-compose down"
fi