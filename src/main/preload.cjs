const { contextBridge, ipcRenderer } = require('electron');
// import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // Mock status (for banner)
  getMockStatus: () => ipcRenderer.invoke('get-mock-status'),
  
  // Conversations
  getConversations: (filters) => ipcRenderer.invoke('get-conversations', filters),
  getConversationById: (id) => ipcRenderer.invoke('get-conversation-by-id', id),
  
  // Messages
  getMessages: (conversationId, options) => ipcRenderer.invoke('get-messages', conversationId, options),
  
  // Send message
  sendMessage: (conversationId, content) => ipcRenderer.invoke('send-message', conversationId, content),
  
  // Utility
  logMessage: (message) => ipcRenderer.send('log-message', message),

});