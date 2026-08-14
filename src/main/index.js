// src/main/index.js

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import log from 'electron-log';
import { getDatabase, getVoipMsService, getMockStatus } from './di.config.js';
import { fileURLToPath } from 'url';
import { registerIpcHandlers } from './ipcHandlers.js';
import { appEvents } from './events.js';
import { hasCredentials as checkCredentials } from './services/CredentialStorageService.js';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.transports.file.maxSize = 2 * 1024 * 1024;  // 2MB

log.info('VoipSMS Desktop starting...');

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
    // Check if this is first run
    const isFirstRun = db.getSetting('first_run_complete') === null;

    if (isFirstRun) {
      // Open first run sync window
      createFirstRunWindow();
    } else {
      // Open main app directly
      createWindow();
    }

    // Close credentials window after a short delay
    setTimeout(() => {
      if (credentialWindow && !credentialWindow.isDestroyed()) {
        credentialWindow.close();
      }
    }, 500);
  });
}

function createFirstRunWindow() {
  let firstRunWindow = new BrowserWindow({
    width: 600,
    height: 450,
    resizable: false,
    modal: false,
    parent: null,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  firstRunWindow.loadFile('src/renderer/firstRun.html');

  // Listen for first-run-complete event
  appEvents.once('first-run-complete', () => {
    // Open main app
    createWindow();
    // Close first-run window
    setTimeout(() => {
      if (firstRunWindow && !firstRunWindow.isDestroyed()) {
        firstRunWindow.close();
      }
    }, 500);
  });

  // Handle sync failure (user clicked abort)
  appEvents.once('first-run-aborted', () => {
    // Re-open credentials window
    createCredentialsWindow();
    // Close first-run window
    setTimeout(() => {
      if (firstRunWindow && !firstRunWindow.isDestroyed()) {
        firstRunWindow.close();
      }
    }, 500);
  });

  // Handle window closed unexpectedly
  firstRunWindow.on('closed', () => {
    firstRunWindow = null;
  });
}

app.whenReady().then(async () => {
  db = await getDatabase();
  voipMsService = await getVoipMsService();

  // Always register ALL handlers (both views need them)
  registerIpcHandlers({ db, voipMsService, getMockStatus });

  // Check if credentials exist (real check, not mock)
  const hasCredentials = await checkCredentials();

  log.info('App ready, creating window...');

  // Load appropriate view based on credential state
  if (hasCredentials) {
    // Check if this is first run (credentials exist but never completed initial sync)
    const isFirstRun = db.getSetting('first_run_complete') === null;

    if (isFirstRun) {
      // Credentials exist but first run never completed
      createFirstRunWindow();
    } else {
      // Normal load - open main app
      createWindow();
    }
  } else {
    createCredentialsWindow();
  }
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});