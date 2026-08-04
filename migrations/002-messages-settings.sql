-- migrations/002-messages-settings.sql

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  did_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
  contact_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  carrier_status TEXT,
  media_urls TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  UNIQUE(message_id, did_id),
  FOREIGN KEY (did_id) REFERENCES dids(id)
);

-- Index for fast conversation loading (messages by DID + timestamp)
CREATE INDEX IF NOT EXISTS idx_messages_did_timestamp ON messages(did_id, timestamp DESC);

-- Settings key-value store
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Contacts table (local only)
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  notes TEXT
);

-- Index for fast contact lookup by phone number
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number);