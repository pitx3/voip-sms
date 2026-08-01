const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getDatabase, getMockStatus } = require('./di.config');

let mainWindow;
let db = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('src/renderer/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize database (from di.config, could be Mock or Real)
  db = getDatabase();

  createWindow();

  // --- IPC Handlers ---

  // Mock status (for banner)
  ipcMain.handle('get-mock-status', async () => {
    return getMockStatus();
  });

  // Conversations
  ipcMain.handle('get-conversations', async (event, filters) => {
    return db.getConversations(filters);
  });

  ipcMain.handle('get-conversation-by-id', async (event, id) => {
    return db.getConversationById(id);
  });

  // Messages
  ipcMain.handle('get-messages', async (event, conversationId, options) => {
    return db.getMessages(conversationId, options);
  });

  // Send message
  ipcMain.handle('send-message', async (event, conversationId, content) => {
    // TODO: Actually send via VoipMsClient
    // For now, just save to DB
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

  // Logging
  ipcMain.on('log-message', (event, message) => {
    console.log('[Renderer says]:', message);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});