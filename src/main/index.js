// src/main/index.js

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { getDatabase, getVoipMsService, getMockStatus } from './di.config.js';
import { fileURLToPath } from 'url';
import { registerIpcHandlers } from './ipcHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let db = null;
let voipMsService = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('src/renderer/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  db = await getDatabase();
  voipMsService = await getVoipMsService();

  createWindow();
  registerIpcHandlers({ db, voipMsService, getMockStatus });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});