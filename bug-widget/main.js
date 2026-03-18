const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const BUGS_FILE = path.join(__dirname, '..', 'bugs', 'bugs.json');
const PROJECT_ROOT = path.join(__dirname, '..');

let mainWindow;
let isPinned = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 480,
    x: 50,
    y: 50,
    alwaysOnTop: isPinned,
    frame: false,
    transparent: true,
    resizable: true,
    minimizable: true,
    skipTaskbar: false,
    minWidth: 280,
    minHeight: 200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('widget.html');
  
  // Watch bugs file for changes and refresh
  if (fs.existsSync(BUGS_FILE)) {
    fs.watchFile(BUGS_FILE, { interval: 2000 }, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('bugs-updated', readBugs());
      }
    });
  }
}

function readBugs() {
  try {
    if (!fs.existsSync(BUGS_FILE)) return [];
    const bugs = JSON.parse(fs.readFileSync(BUGS_FILE, 'utf-8'));
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    bugs.sort((a, b) => (order[a.severity] || 99) - (order[b.severity] || 99));
    return bugs;
  } catch {
    return [];
  }
}

// Resolve file path to absolute
function resolveFilePath(file) {
  if (!file) return null;
  if (path.isAbsolute(file)) return file;
  const fromRoot = path.join(PROJECT_ROOT, file);
  if (fs.existsSync(fromRoot)) return fromRoot;
  const fromTests = path.join(PROJECT_ROOT, 'tests', file);
  if (fs.existsSync(fromTests)) return fromTests;
  return file;
}

// IPC handlers
ipcMain.handle('get-bugs', () => readBugs());

// Toggle always-on-top (pin/unpin)
ipcMain.handle('toggle-pin', () => {
  isPinned = !isPinned;
  mainWindow.setAlwaysOnTop(isPinned);
  return isPinned;
});

ipcMain.handle('get-pin-state', () => isPinned);

// Open project folder in VS Code and navigate to file:line
ipcMain.handle('open-code', (event, file, line) => {
  const resolved = resolveFilePath(file);
  // First open the project folder, then go to specific file:line
  const cmd = `code "${PROJECT_ROOT}" -g "${resolved}:${line || 1}"`;
  console.log(`Opening: ${cmd}`);
  exec(cmd, (err) => {
    if (err) console.error(`Failed to open: ${err.message}`);
  });
});

ipcMain.handle('minimize-widget', () => {
  mainWindow.minimize();
});

ipcMain.handle('close-widget', () => {
  app.quit();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (fs.existsSync(BUGS_FILE)) fs.unwatchFile(BUGS_FILE);
  app.quit();
});
