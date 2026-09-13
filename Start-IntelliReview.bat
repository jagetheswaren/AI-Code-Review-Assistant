@echo off
setlocal EnableDelayedExpansion

title IntelliReview AI - Launcher

cd /d "%~dp0"
if not exist "logs" mkdir "logs"

echo ===================================================
echo     IntelliReview AI - Startup Sequence
echo ===================================================
echo.

:: 1. Check Docker Desktop installation
echo [1/8] Checking Docker...
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] IntelliReview AI requires Docker Desktop for the local MongoDB database.
    echo Please install/start Docker Desktop and try again.
    pause
    exit /b
)

:: 2. Check Docker Engine running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Please start Docker Desktop and wait until Docker Engine is running.
    pause
    exit /b
)

:: 3 & 4 & 5 & 6. Start MongoDB via existing docker-compose
echo [2/8] Checking MongoDB database...
netstat -ano | findstr ":27017 " | findstr "LISTENING" >nul 2>&1
if !ERRORLEVEL! equ 0 (
    echo MongoDB is already running on port 27017.
) else (
    if exist "docker-compose.yml" (
        docker compose up -d mongodb > logs\docker.log 2>&1
        if !ERRORLEVEL! neq 0 (
            echo [WARNING] Failed to start MongoDB container. Check logs\docker.log
            echo The application may still work if you have a local MongoDB installed.
        )
    ) else (
        echo [ERROR] docker-compose.yml not found.
        pause
        exit /b
    )
)

:: 7. Check Ollama installation
echo [3/8] Checking Ollama...
where ollama >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] IntelliReview AI requires Ollama for local AI code review.
    echo Please install Ollama from https://ollama.com/
    pause
) else (
    :: 8 & 9 & 10. Check specific model
    echo [4/8] Checking AI Model qwen2.5-coder:7b ...
    ollama list | findstr "qwen2.5-coder:7b" >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo [WARNING] The required AI model qwen2.5-coder:7b is not installed.
        echo Please open a terminal or command prompt and run exactly this command:
        echo     ollama run qwen2.5-coder:7b
        echo Once the model finishes downloading, you can restart this application.
        pause
    )
)

:: 11. Start Flask backend (Check if running first)
echo [5/8] Checking Backend Service...
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Backend is already running on port 5000.
) else (
    echo Starting Backend Service...
    powershell -Command "Start-Process cmd -ArgumentList '/c cd backend && .\venv\Scripts\activate.bat && python app.py > ..\logs\backend.log 2>&1' -WindowStyle Hidden"
)

:: 12. Start React frontend (Check if running first)
echo [6/8] Checking Frontend Service...
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Frontend is already running on port 3000.
) else (
    echo Starting Frontend Service...
    powershell -Command "Start-Process cmd -ArgumentList '/c cd frontend && set BROWSER=none&& npm start > ..\logs\frontend.log 2>&1' -WindowStyle Hidden"
)

:: 13. Wait for backend health check
echo [7/8] Waiting for Backend to become healthy...
set max_retries=30
set retry_count=0
:wait_backend
powershell -Command "try { $response = Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Backend is ready!
) else (
    set /a retry_count+=1
    if !retry_count! gtr !max_retries! (
        echo [ERROR] Backend failed to start after 30 seconds.
        echo Please check logs\backend.log for details.
        pause
        exit /b
    )
    timeout /t 1 >nul
    goto wait_backend
)

:: 14. Wait for frontend availability
echo [8/8] Waiting for Frontend to become ready...
set retry_count=0
:wait_frontend
powershell -Command "try { $response = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Frontend is ready!
) else (
    set /a retry_count+=1
    if !retry_count! gtr !max_retries! (
        echo [ERROR] Frontend failed to start after 30 seconds.
        echo Please check logs\frontend.log for details.
        pause
        exit /b
    )
    timeout /t 1 >nul
    goto wait_frontend
)

:: 15 & 16. Open IntelliReview AI in an app-like standalone browser window
echo.
echo Launching IntelliReview AI...
:: Try Chrome first, then Edge, then default browser
start chrome --app=http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    start msedge --app=http://localhost:3000 >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        start http://localhost:3000
    )
)

echo.
echo ===================================================
echo     IntelliReview AI is now running!
echo ===================================================
echo You may close this window. The background services will remain running.
echo To completely stop the app, you will need to restart your computer or stop the python/node processes in Task Manager.
timeout /t 5 >nul
exit
