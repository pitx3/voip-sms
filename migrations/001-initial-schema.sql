-- Accounts (your DIDs)
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    did TEXT NOT NULL UNIQUE,
    name TEXT,
    description TEXT,
    sms_enabled INTEGER DEFAULT 1,
    mms_enabled INTEGER DEFAULT 1,
    last_sync_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    contact_number TEXT NOT NULL,
    contact_name TEXT,
    last_message_date TEXT,
    last_message_text TEXT,
    unread_count INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE(account_id, contact_number)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    voipms_id TEXT,
    direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
    type TEXT NOT NULL CHECK(type IN ('sms', 'mms')),
    content TEXT,
    timestamp TEXT NOT NULL,
    carrier_status TEXT,
    is_deleted INTEGER DEFAULT 0,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    voipms_media_url TEXT NOT NULL,
    local_file_path TEXT,
    mime_type TEXT,
    filename TEXT,
    file_size INTEGER,
    download_status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Send Tracker
CREATE TABLE IF NOT EXISTS sent_messages_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    account_id INTEGER NOT NULL,
    dst TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('sms', 'mms')),
    status TEXT NOT NULL,
    voipms_id TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);