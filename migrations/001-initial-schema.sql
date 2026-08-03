-- Migration 001: Initial schema (DIDs only)
-- Add more tables as we build out conversations, messages, etc.

CREATE TABLE IF NOT EXISTS dids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  did TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  sms_enabled INTEGER DEFAULT 1,
  mms_available INTEGER DEFAULT 1,
  last_sync_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dids_did ON dids(did);