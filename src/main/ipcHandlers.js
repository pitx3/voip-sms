// src/main/ipcHandlers.js

import { ipcMain } from 'electron';
import { appEvents } from './events.js';

// TEMPORARY: In-memory credential storage
let storedCredentials = null;

export function registerIpcHandlers({ db, voipMsService, getMockStatus }) {
  // Mock status (for banner)
  ipcMain.handle('get-mock-status', async () => getMockStatus());

  // Conversations (DB)
  ipcMain.handle('get-conversations', async (event, filters) => {
    return db.getConversations(filters);
  });

  ipcMain.handle('get-conversation-by-id', async (event, id) => {
    return db.getConversationById(id);
  });

  // Messages (DB)
  ipcMain.handle('get-messages', async (event, conversationId, options) => {
    return db.getMessages(conversationId, options);
  });

  // Send message (DB - for now)
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

  // Voip.ms Operations
  ipcMain.handle('get-dids-voipms', async () => {
    return voipMsService.getDIDs();
  });

  ipcMain.handle('fetch-messages-voipms', async (event, options) => {
    return voipMsService.getMessages(options);
  });

  ipcMain.handle('send-message-voipms', async (event, params) => {
    return voipMsService.sendMessage(params);
  });

  // Credentials (TEMPORARY - in-memory)
  ipcMain.handle('has-credentials', async () => {
    return { hasCredentials: storedCredentials !== null };
  });

  ipcMain.handle('test-credentials', async (event, { username, password }) => {
    // TEMPORARY: Always succeed for UI testing
    return {
      success: true,
      message: 'Connection successful'
    };
  });

  ipcMain.handle('save-credentials', async (event, { username, password }) => {
    // TEMPORARY: Store in memory
    storedCredentials = { username, password };
    
    // Emit event for main process to handle window switching
    appEvents.emit('credentials-saved');
    
    return {
      success: true,
      message: 'Credentials saved'
    };
  });

  // Logging
  ipcMain.on('log-message', (event, message) => {
    console.log('[Renderer says]:', message);
  });
}