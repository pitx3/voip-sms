// src/main/index.js

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { getDatabase, getVoipMsService, getMockStatus } from './di.config.js';
import { fileURLToPath } from 'url';
import { registerIpcHandlers } from './ipcHandlers.js';
import { appEvents } from './events.js';
import { hasCredentials as checkCredentials } from './services/CredentialStorageService.js';

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

  // Listen for logout - switch to credentials window
  appEvents.once('credentials-deleted', () => {    
    // Create credentials window FIRST
    createCredentialsWindow();
    
    // THEN close main window
    mainWindow.close();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// can we save?

function createCredentialsWindow() {
  
  const credentialWindow = new BrowserWindow({
    width: 500,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  credentialWindow.loadFile('src/renderer/credentials.html');

  // Listen for credentials-saved event (from EventEmitter, not IPC)
  appEvents.once('credentials-saved', () => {
    // Create main window FIRST
    createWindow();
    // THEN close credentials window
    credentialWindow.close();
  });
}

app.whenReady().then(async () => {
  db = await getDatabase();
  voipMsService = await getVoipMsService();

  // Always register ALL handlers (both views need them)
  registerIpcHandlers({ db, voipMsService, getMockStatus });

  // Check if credentials exist (real check, not mock)
  const hasCredentials = await checkCredentials();

  // Load appropriate view based on credential state
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