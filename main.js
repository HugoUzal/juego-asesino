const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const { fork } = require('child_process');

const PORT = process.env.PORT || 3000;

let mainWindow;
let serverProcess;

function startServer() {
  const serverPath = path.join(__dirname, 'server', 'server.js');
  serverProcess = fork(serverPath, [], {
    cwd: path.join(__dirname, 'server'),
    env: { ...process.env, PORT },
  });

  serverProcess.on('error', (err) => {
    console.error('[SERVIDOR] Error al iniciar:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`[SERVIDOR] Proceso terminado con código ${code}`);
  });
}

function waitForServer(url, callback, remaining = 40) {
  http
    .get(url, () => callback())
    .on('error', () => {
      if (remaining <= 0) {
        console.error('[ELECTRON] No se pudo conectar al servidor, abriendo de todas formas');
        callback();
        return;
      }
      setTimeout(() => waitForServer(url, callback, remaining - 1), 250);
    });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'Juego Asesino',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  waitForServer(`http://localhost:${PORT}`, createWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
