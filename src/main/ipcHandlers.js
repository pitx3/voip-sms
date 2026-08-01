// src/main/ipcHandlers.js

import { ipcMain } from 'electron';

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

  // Logging
  ipcMain.on('log-message', (event, message) => {
    console.log('[Renderer says]:', message);
  });
}