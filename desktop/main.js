const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const express = require('express');
const http = require('http');

let mainWindow;
let backendProcess;
let expressServer;

const isPackaged = app.isPackaged;
const rootPath = isPackaged ? process.resourcesPath : path.join(__dirname, '..');

function runCommand(command, cwd) {
    return new Promise((resolve) => {
        exec(command, { cwd, windowsHide: true }, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}

async function checkPrerequisites() {
    // Check Docker
    const dockerCheck = await runCommand('docker info');
    if (dockerCheck.error) {
        dialog.showErrorBox('Docker Required', 'Docker Desktop is not running or not installed. IntelliReview AI requires Docker for the local MongoDB database. Please install and start Docker Desktop.');
        app.quit();
        return false;
    }

    // Check Ollama
    const ollamaCheck = await runCommand('ollama list');
    if (ollamaCheck.error) {
        dialog.showErrorBox('Ollama Required', 'Ollama is not installed or not running. Please install Ollama from https://ollama.com/ to use the AI features.');
        app.quit();
        return false;
    }

    if (!ollamaCheck.stdout.includes('qwen2.5-coder:7b')) {
        dialog.showErrorBox('Model Required', 'The required AI model "qwen2.5-coder:7b" is not installed. Please open a command prompt and run:\n\nollama run qwen2.5-coder:7b\n\nThen restart this application.');
        app.quit();
        return false;
    }

    return true;
}

async function startServices() {
    // 1. Start MongoDB
    console.log('Starting MongoDB...');
    await runCommand('docker compose up -d mongodb', rootPath);

    // 2. Start Flask Backend
    console.log('Starting Flask Backend...');
    const backendDir = path.join(rootPath, 'backend');
    let backendExecutable;

    if (isPackaged) {
        backendExecutable = path.join(backendDir, 'backend.exe');
    } else {
        // In dev mode, we can still run it via python if we are testing locally
        // but for now let's just assume we run the python app.py directly for dev.
        backendExecutable = path.join(backendDir, '..', 'backend', 'venv', 'Scripts', 'python.exe');
    }
    
    const args = isPackaged ? [] : ['app.py'];
    const cwdPath = isPackaged ? backendDir : path.join(rootPath, '..', 'backend');

    backendProcess = spawn(backendExecutable, args, {
        cwd: cwdPath,
        windowsHide: true,
        stdio: 'pipe' // Capture stdout/stderr
    });

    backendProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`));
    backendProcess.stderr.on('data', (data) => console.error(`Backend Error: ${data}`));

    // Wait for backend health
    await new Promise(resolve => {
        let retries = 0;
        const interval = setInterval(() => {
            http.get('http://localhost:5000/health', (res) => {
                if (res.statusCode === 200) {
                    clearInterval(interval);
                    resolve();
                }
            }).on('error', () => {
                retries++;
                if (retries > 30) {
                    clearInterval(interval);
                    dialog.showErrorBox('Backend Error', 'Failed to start the Flask backend. Please check your system environment.');
                    app.quit();
                }
            });
        }, 1000);
    });

    // 3. Start Express server for Frontend
    console.log('Starting Express Frontend Server...');
    const expressApp = express();
    const frontendBuildPath = path.join(rootPath, 'frontend', 'build');
    
    expressApp.use(express.static(frontendBuildPath));
    expressApp.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });

    await new Promise(resolve => {
        expressServer = expressApp.listen(3000, () => {
            console.log('Frontend server listening on port 3000');
            resolve();
        });
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: path.join(__dirname, 'assets', 'IntelliReviewAI.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadURL('http://localhost:3000');
}

app.whenReady().then(async () => {
    if (await checkPrerequisites()) {
        await startServices();
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
    if (expressServer) {
        expressServer.close();
    }
});
