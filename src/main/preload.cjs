// src/main/preload.cjs

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Mock status (for banner)
  getMockStatus: () => ipcRenderer.invoke('get-mock-status'),
  
  // =========================================
  // DIDs - Fast Path (Database)
  // =========================================
  getDidsDb: () => ipcRenderer.invoke('get-dids-db'),
  
  // =========================================
  // DIDs - Slow Path (Voip.ms API Sync)
  // =========================================
  getDidsVoipms: () => ipcRenderer.invoke('get-dids-voipms'),
  
  // =========================================
  // Conversations
  // =========================================
  getConversations: (filters) => ipcRenderer.invoke('get-conversations', filters),
  getConversationById: (id) => ipcRenderer.invoke('get-conversation-by-id', id),
  
  // =========================================
  // Messages
  // =========================================
  // Messages - fast path (read from DB)
  getMessagesDb: (options) => ipcRenderer.invoke('get-messages-db', options),

  // Messages - sync from API
  syncMessagesVoipms: () => ipcRenderer.invoke('sync-messages-voipms'),
  
  // =========================================
  // Send Message
  // =========================================
  sendMessage: (conversationId, content) => ipcRenderer.invoke('send-message', conversationId, content),
  
  // =========================================
  // Voip.ms Operations (API Sync)
  // =========================================
  fetchMessagesVoipms: (options) => ipcRenderer.invoke('fetch-messages-voipms'),
  sendMessageVoipms: (params) => ipcRenderer.invoke('send-message-voipms'),
  
  // =========================================
  // Credentials
  // =========================================
  hasCredentials: () => ipcRenderer.invoke('has-credentials'),
  testCredentials: (credentials) => ipcRenderer.invoke('test-credentials', credentials),
  saveCredentials: (credentials) => ipcRenderer.invoke('save-credentials', credentials),
  deleteCredentials: () => ipcRenderer.invoke('delete-credentials'),
  
  // =========================================
  // Utility
  // =========================================
  logMessage: (message) => ipcRenderer.send('log-message', message),
});