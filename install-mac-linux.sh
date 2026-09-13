#!/bin/bash

echo "==================================================="
echo "    IntelliReview AI - Automated Installer"
echo "==================================================="
echo ""
echo "This script will set up and start the application on your computer."
echo "Requirements: Python 3.11+, Node.js 18+, Docker Desktop"
echo ""

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

echo "[1/4] Setting up Python Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
echo "Installing backend dependencies..."
source venv/bin/activate
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to install Python dependencies. Please ensure Python 3.11+ is installed."
    exit 1
fi
cd ..

echo "[2/4] Setting up React Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
if [ $? -ne 0 ]; then
    echo "Failed to install Node dependencies. Please ensure Node.js is installed."
    exit 1
fi
cd ..

echo "[3/4] Starting MongoDB via Docker..."
echo "Please ensure Docker Desktop is running on your machine!"
docker-compose up -d mongodb
if [ $? -ne 0 ]; then
    # Try the newer docker compose syntax if docker-compose fails
    docker compose up -d mongodb
    if [ $? -ne 0 ]; then
        echo "Docker is not running or not installed. Please install and start Docker Desktop!"
        exit 1
    fi
fi

echo "[4/4] Starting the Application Servers..."
# Open backend in background
(cd backend && source venv/bin/activate && python app.py) &
BACKEND_PID=$!

# Open frontend in background
(cd frontend && npm start) &
FRONTEND_PID=$!

echo ""
echo "==================================================="
echo "                 SETUP COMPLETE!"
echo "==================================================="
echo "The application should automatically open in your browser at http://localhost:3000"
echo "If not, please open your browser and navigate there manually."
echo ""
echo "Press Ctrl+C to stop the servers."

# Wait for background processes to exit
wait $BACKEND_PID $FRONTEND_PID
