const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getGreeting: (name) => ipcRenderer.invoke('get-greeting', name),
    logMessage: (message) => ipcRenderer.send('log-message', message)
});