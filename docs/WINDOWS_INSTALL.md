# Windows Desktop Installation Guide

This guide explains how to install and run IntelliReview AI on Windows like a standard desktop application.

## 1. System Requirements
Before installing, ensure you have the following installed on your PC:
- **Python 3.11+**: Make sure "Add Python to PATH" is checked during installation.
- **Node.js 18+**
- **Docker Desktop**: Required to run the local MongoDB database.
- **Ollama**: (Optional but highly recommended) Required for local AI code reviews.

## 2. Docker Desktop Setup
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop).
2. Install and launch Docker Desktop.
3. Wait until you see the green "Engine Running" status in the system tray.

## 3. Ollama Setup (AI Reviews)
1. Download Ollama from [ollama.com](https://ollama.com/).
2. Install and launch Ollama.
3. Open a Command Prompt and run the following command to download the model used by this app:
   ```bash
   ollama run qwen2.5-coder:7b
   ```
4. Wait for the download to finish. You can close the window afterward.

## 4. Installing IntelliReview AI
1. Download the `IntelliReview-v1.0.zip` release file.
2. Extract the folder to a permanent location (e.g., `C:\Users\YourName\Documents\IntelliReview`).
3. Double-click the **`install-windows.bat`** file.
4. The installer will automatically download the required dependencies.
5. Once finished, it will create an **"IntelliReview AI"** shortcut on your Desktop.

## 5. Starting the Application
1. Double-click the **IntelliReview AI** icon on your Desktop.
2. The launcher will verify that Docker and Ollama are running.
3. The database, backend, and frontend will start in the background.
4. The application will automatically open in a standalone app-like browser window!

## 6. Stopping the Services
The background services (Flask and React) will remain running to make opening the app faster in the future.
If you need to completely stop them, restart your PC or manually end the `python.exe` and `node.exe` tasks in Windows Task Manager.

## 7. Troubleshooting & Logs
If the app fails to launch, check the log files located in the `logs/` directory of your installation folder:
- `logs/backend.log`: Errors related to the Python API.
- `logs/frontend.log`: Errors related to the React UI.
- `logs/docker.log`: Errors related to starting the MongoDB database.

**Common Issues:**
- **"Docker is not running"**: Ensure Docker Desktop is actually open and the engine is running before clicking the desktop shortcut.
- **"Port already in use"**: The services might already be running in the background.
- **Missing AI Reviews**: Ensure you have run `ollama run qwen2.5-coder:7b` at least once in your command prompt.
