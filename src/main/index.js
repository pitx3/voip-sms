// src/main/index.js

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { getDatabase, getVoipMsService, getMockStatus } from './di.config.js';
import { fileURLToPath } from 'url';
import { registerIpcHandlers } from './ipcHandlers.js';
import { appEvents } from './events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let db = null;
let voipMsService = null;

// TEMPORARY: Mock credential state for UI testing
const MOCK_HAS_CREDENTIALS = true; // Toggle to test both flows

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
  console.log('[Main] createWindow called');

  mainWindow.loadFile('src/renderer/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createCredentialsWindow() {
  console.log('[Main] Creating credentials window');
  
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('src/renderer/credentials.html');

  // Listen for credentials-saved event (from EventEmitter, not IPC)
  appEvents.once('credentials-saved', () => {
    console.log('[Main] Credentials saved - switching to main window');
    
    // Create main window FIRST
    createWindow();
    
    // THEN close credentials window
    mainWindow.close();
  });
}

app.whenReady().then(async () => {
  db = await getDatabase();
  voipMsService = await getVoipMsService();

  // Always register ALL handlers (both views need them)
  registerIpcHandlers({ db, voipMsService, getMockStatus });

  // Load appropriate view based on credential state
  const hasCredentials = MOCK_HAS_CREDENTIALS;

  if (hasCredentials) {
    createWindow();
  } else {
    createCredentialsWindow();
  }
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