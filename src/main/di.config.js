// src/main/di.config.js

const path = require('path');
const { app } = require('electron');

// --- Environment Classification ---
// Only these environments default to mock
const MOCK_ENVS = ['development', 'dev', 'test', 'qa', 'integration'];

const env = (process.env.NODE_ENV || '').toLowerCase();
const isMockDefaultEnv = MOCK_ENVS.includes(env);

// --- Configuration Flags ---
// Explicit flag wins, otherwise environment default applies
const CONFIG = {
  USE_MOCK_DB: process.env.USE_MOCK_DB === 'true'
    ? true
    : (process.env.USE_MOCK_DB === 'false'
        ? false
        : isMockDefaultEnv),
  
  USE_MOCK_VOIPMS: process.env.USE_MOCK_VOIPMS === 'true'
    ? true
    : (process.env.USE_MOCK_VOIPMS === 'false'
        ? false
        : isMockDefaultEnv),
};

// --- Singleton Instances ---
let dbInstance = null;
let voipmsInstance = null;

// --- Database ---
function getDatabase() {
  if (!dbInstance) {
    if (CONFIG.USE_MOCK_DB) {
      const MockDatabase = require('./db/MockDatabase');
      dbInstance = new MockDatabase();
    } else {
      const SqliteDatabase = require('./db/SqliteDatabase');
      const dbPath = path.join(app.getPath('userData'), 'voip-sms.db');
      dbInstance = new SqliteDatabase(dbPath);
    }
    
    dbInstance.init();
  }
  
  return dbInstance;
}

// --- Voip.ms Client ---
function getVoipMsClient() {
  if (!voipmsInstance) {
    if (CONFIG.USE_MOCK_VOIPMS) {
      const MockVoipMsClient = require('./voipms/MockVoipMsClient');
      voipmsInstance = new MockVoipMsClient();
    } else {
      const RealVoipMsClient = require('./voipms/RealVoipMsClient');
      voipmsInstance = new RealVoipMsClient({ /* credentials from keyring later */ });
    }
  }
  
  return voipmsInstance;
}

// --- Mock Status (for UI banner) ---
function getMockStatus() {
  return {
    isMock: CONFIG.USE_MOCK_DB || CONFIG.USE_MOCK_VOIPMS,
    useMockDb: CONFIG.USE_MOCK_DB,
    useMockVoipms: CONFIG.USE_MOCK_VOIPMS
  };
}

// --- Reset (for CLI script / testing) ---
function reset() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  voipmsInstance = null;
}

module.exports = {
  getDatabase,
  getVoipMsClient,
  getMockStatus,
  reset,
  CONFIG
};