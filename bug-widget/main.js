const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const BUGS_FILE = path.join(__dirname, '..', 'bugs', 'bugs.json');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 400,
    x: 50,
    y: 50,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('widget.html');
  
  // Watch bugs file for changes and refresh
  if (fs.existsSync(BUGS_FILE)) {
    fs.watchFile(BUGS_FILE, { interval: 2000 }, () => {
      mainWindow.webContents.send('bugs-updated', readBugs());
    });
  }
}

function readBugs() {
  try {
    if (!fs.existsSync(BUGS_FILE)) return [];
    return JSON.parse(fs.readFileSync(BUGS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

// IPC handlers
ipcMain.handle('get-bugs', () => readBugs());

ipcMain.handle('open-code', (event, file, line) => {
  exec(`code -g "${file}:${line || 1}"`);
});

ipcMain.handle('close-widget', () => {
  app.quit();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  fs.unwatchFile(BUGS_FILE);
  app.quit();
});
