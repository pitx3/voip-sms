// src/main/preload.cjs

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Mock status (for banner)
  getMockStatus: () => ipcRenderer.invoke('get-mock-status'),
  
  // =========================================
  // DB Operations (fast)
  // =========================================
  // Get DIDs
  getDidsDb: () => ipcRenderer.invoke('get-dids-db'),
  
   // Messages - read from database
  getMessagesDb: (options) => ipcRenderer.invoke('get-messages-db', options),

  // Contacts - lookup by phone number
  getContactDb: (phoneNumber) => ipcRenderer.invoke('get-contact-db', phoneNumber),
  
  
  // =========================================
  // voip.ms Operations (slow)
  // =========================================

  // Get DIDs
  getDidsVoipms: () => ipcRenderer.invoke('get-dids-voipms'),

  // Messages - sync from API
  syncMessagesVoipms: () => ipcRenderer.invoke('sync-messages-voipms'),
  

  // =========================================
  // Credentials (test is slow, all others are fast)
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