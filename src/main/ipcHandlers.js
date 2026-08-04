// src/main/ipcHandlers.js

import { ipcMain } from 'electron';
import { appEvents } from './events.js';
import { saveCredentials, getCredentials, hasCredentials as checkCredentials, deleteCredentials } from './services/CredentialStorageService.js';

export function registerIpcHandlers({ db, voipMsService, getMockStatus }) {
  // Mock status (for banner)
  ipcMain.handle('get-mock-status', async () => getMockStatus());

  // =========================================
  // DB Operations (fast)
  // =========================================

  // get DIDs
  ipcMain.handle('get-dids-db', () => {
    const dids = db.getDids();
    return { dids };
  });

  // Get messages from database (with optional filtering)
  ipcMain.handle('get-messages-db', (event, options = {}) => {
    const messages = db.getMessages(options);
    return { messages };
  });

  // Get contact by phone number
  ipcMain.handle('get-contact-db', (event, phoneNumber) => {
    const contact = db.getContact(phoneNumber);
    return { contact };
  });

  // =========================================
  // Voip.ms Operations (API = slower)
  // =========================================

  // get DIDs
  ipcMain.handle('get-dids-voipms', async () => {
    const dids = await voipMsService.getDids();
    return { dids };
  });

  // Sync messages from Voip.ms API (slow path)
  ipcMain.handle('sync-messages-voipms', async () => {
    try {
      const messages = await voipMsService.getMessages();
      return { success: true, count: messages.length };
    } catch (error) {
      console.error('Failed to sync messages:', error);
      return { success: false, error: error.message };
    }
  });


  // =========================================
  // Credentials (test is slow, all others are fast)
  // =========================================

  ipcMain.handle('has-credentials', async () => {
    const exists = await checkCredentials();
    return { hasCredentials: exists };
  });

  ipcMain.handle('test-credentials', async (event, { username, password }) => {
    console.log('[IPC] test-credentials called with username:', username);

    const result = await voipMsService.testConnection({ username, password });

    console.log('[IPC] Result received:', result);
    return result;
  });

  ipcMain.handle('save-credentials', async (event, { username, password }) => {
    try {
      await saveCredentials(username, password);
      appEvents.emit('credentials-saved');

      return {
        success: true,
        message: 'Credentials saved'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  });

  ipcMain.handle('delete-credentials', async () => {
    try {
      await deleteCredentials();
      appEvents.emit('credentials-deleted');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // =========================================
  // Logging
  // =========================================

  ipcMain.on('log-message', (event, message) => {
    console.log('[Renderer says]:', message);
  });
}