const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const MigrationRunner = require('./db/MigrationRunner');
const SqliteDatabase = require('./db/SqliteDatabase');

let mainWindow;
let db;

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

    mainWindow.loadFile('renderer/index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    // Get database path in user data directory
    const dbPath = path.join(app.getPath('userData'), 'voip-sms.db');

    // Run migrations first
    const migrator = new MigrationRunner(dbPath);
    migrator.run();

    // Initialize database for CRUD
    db = new SqliteDatabase(dbPath);
    await db.init();

    // Create window after database is ready
    createWindow();

    ipcMain.handle('get-greeting', async (event, name) => {
        return `Hello from main process, ${name}!`;
    });

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