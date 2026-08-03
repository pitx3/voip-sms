// src/main/ipcHandlers.js

import { ipcMain } from 'electron';
import { appEvents } from './events.js';
import { saveCredentials, getCredentials, hasCredentials as checkCredentials, deleteCredentials } from './services/CredentialStorageService.js';

export function registerIpcHandlers({ db, voipMsService, getMockStatus }) {
  // Mock status (for banner)
  ipcMain.handle('get-mock-status', async () => getMockStatus());

  // =========================================
  // DIDs - Fast Path (Database)
  // =========================================

  ipcMain.handle('get-dids-db', async () => {
    const dids = db.getDids();
    return { dids };
  });

  // =========================================
  // DIDs - Slow Path (Voip.ms API Sync)
  // =========================================

  ipcMain.handle('get-dids-voipms', async () => {
    const dids = await voipMsService.getDids();
    return { dids };
  });

  // =========================================
  // Conversations (DB)
  // =========================================

  ipcMain.handle('get-conversations', async (event, filters) => {
    return db.getConversations(filters);
  });

  ipcMain.handle('get-conversation-by-id', async (event, id) => {
    return db.getConversationById(id);
  });

  // =========================================
  // Messages (DB)
  // =========================================

  ipcMain.handle('get-messages', async (event, conversationId, options) => {
    return db.getMessages(conversationId, options);
  });

  // =========================================
  // Send Message (DB - for now)
  // =========================================

  ipcMain.handle('send-message', async (event, conversationId, content) => {
    const message = db.addMessage({
      conversation_id: conversationId,
      direction: 'outbound',
      type: 'sms',
      content: content,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      carrier_status: 'pending'
    });
    return message;
  });

  // =========================================
  // Voip.ms Operations (API Sync)
  // =========================================

  // Get messages from local database (fast path)
  ipcMain.handle('get-messages-db', async (event, options = {}) => {
    const messages = await database.getMessages(options);
    return { messages };
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
  // Credentials
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