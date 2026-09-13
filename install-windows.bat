@echo off
setlocal EnableDelayedExpansion

set SILENT_MODE=0
if "%~1"=="--silent" set SILENT_MODE=1

title IntelliReview AI - Local Environment Setup

echo ===================================================
echo     IntelliReview AI - Environment Setup
echo ===================================================
echo.
echo This script will set up the local application environment.
echo Requirements: Python 3.11+, Node.js 18+, Docker Desktop
echo.

cd /d "%~dp0"
set "PROJECT_ROOT=%~dp0"

echo [1/4] Setting up Python Backend...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)
echo Installing backend dependencies...
call ".\venv\Scripts\activate.bat"
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install Python dependencies. Please ensure Python 3.11+ is installed.
    if %SILENT_MODE%==0 pause
    exit /b
)
cd ..

echo [2/4] Setting up React Frontend...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install Node dependencies. Please ensure Node.js is installed.
    if %SILENT_MODE%==0 pause
    exit /b
)
cd ..

echo [3/4] Creating Desktop Shortcut...
powershell -Command "$wshell = New-Object -ComObject WScript.Shell; $shortcut = $wshell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\IntelliReview AI.lnk'); $shortcut.TargetPath = '%PROJECT_ROOT%start-intellireview.bat'; $shortcut.WorkingDirectory = '%PROJECT_ROOT%'; $shortcut.IconLocation = 'shell32.dll, 21'; $shortcut.Save()"
if exist "%USERPROFILE%\Desktop\IntelliReview AI.lnk" (
    echo Shortcut created successfully!
) else (
    echo [WARNING] Failed to create desktop shortcut.
)

echo [4/4] Verifying Setup...
if exist "start-intellireview.bat" (
    echo Launcher script verified.
) else (
    echo [WARNING] start-intellireview.bat not found.
)

echo.
echo ===================================================
echo                 SETUP COMPLETE!
echo ===================================================
echo.
echo A shortcut named "IntelliReview AI" has been placed on your Desktop!
echo.
echo IMPORTANT REQUIREMENTS BEFORE PLAYING:
echo 1. Ensure Docker Desktop is installed and running.
echo 2. (Optional) Ensure Ollama is installed to enable AI features.
echo.
echo To start the app, simply double-click the "IntelliReview AI" icon on your Desktop!
echo.
if %SILENT_MODE%==0 pause
exit
