// src/main/preload.cjs

const { contextBridge, ipcRenderer } = require('electron');

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
  
  // Voip.ms Operations
  getDIDsVoipms: () => ipcRenderer.invoke('get-dids-voipms'),
  fetchMessagesVoipms: (options) => ipcRenderer.invoke('fetch-messages-voipms'),
  sendMessageVoipms: (params) => ipcRenderer.invoke('send-message-voipms'),
  
  // Credentials
  hasCredentials: () => ipcRenderer.invoke('has-credentials'),
  testCredentials: (credentials) => ipcRenderer.invoke('test-credentials', credentials),
  saveCredentials: (credentials) => ipcRenderer.invoke('save-credentials', credentials),
  
  // Utility
  logMessage: (message) => ipcRenderer.send('log-message', message),
});