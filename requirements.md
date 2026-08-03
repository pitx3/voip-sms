

# Voip.ms SMS Desktop App

## Project Overview

A native Linux desktop SMS/MMS application for Voip.ms that provides a proper messaging experience for Voip.ms phone numbers. This fills the gap between the clunky web portal and the Android-only phone app.

**Why this exists:**
- Voip.ms web portal is browser-based and awkward for daily messaging
- The existing phone app (voipms-sms-client) is Android-only
- No native Linux desktop option exists
- Personal quality-of-life tool, not a commercial product

---

## Requirements

### Framework & Stack
| Decision | Value |
|----------|-------|
| Framework | Electron |
| Language | JavaScript |
| Database | SQLite (`better-sqlite3`) |
| Platform | Linux Desktop (Debian/Qubes) |

### UI Layout
| Component | Behavior |
|-----------|----------|
| **Conversation List** | Flat list, no icons, sorted by last message (newest first) |
| **Message Thread** | Newest at bottom, infinite scroll up (load 20 at a time) |
| **DID Selector** | Only in "New Message" dialog, not in main view |
| **Contact Names** | User-set (optional), falls back to formatted phone number |
| **Status Bar** | "Last checked: YYYY-MM-DD HH:MM:SS" + unread count |
| **No Search** | Intentionally excluded |

### DID Handling
| Behavior | Value |
|----------|-------|
| Display format | `{name}: ({xxx}) {xxx}-{xxxx}` or just formatted number |
| User-set names | Yes, configurable in Settings |
| Per-conversation | Each conversation is tied to one DID |
| Same contact, different DID | Creates separate conversation records |

### Deletion & Archive
| Action | Shortcut | Behavior |
|--------|----------|----------|
| **Soft Delete** | `Delete` or context menu | Sets `is_deleted = 1` locally, server untouched |
| **Hard Delete** | `Shift+Delete` | Deletes locally + API call to delete on server |
| **Archive** | Context menu | Sets `is_archived = 1`, hidden from main list |
| **View Archived** | Menu: View → Archived Conversations | Shows archived conversations with unarchive option |

### Attachments (MMS)
| Behavior | Value |
|----------|-------|
| **Download** | Auto-download during polling |
| **Inline display** | Max 300px height, clickable |
| **Full-size view** | Single-click opens lightbox modal |
| **Failed download** | Retry 3x, show error icon, click to retry |
| **Deleted from server** | Show unavailable icon, not clickable |
| **On message delete** | Cascade delete (files removed from disk) |
| **Supported types** | JPG, GIF, JPEG, PNG, MP3, WAV, MIDI, MP4, 3GP |
| **Max size** | 1.3 MB per attachment, 3 attachments max |

### Read Status
| Scenario | Behavior |
|----------|----------|
| Open conversation + app focused | Mark all as read immediately |
| Open conversation + app NOT focused | Wait until app regains focus |
| New message arrives + scrolled to bottom | Auto-scroll, mark as read |
| New message arrives + NOT at bottom | Don't scroll, keep unread, show indicator |
| Scroll to bottom manually | Mark all visible as read |
| Unread indicator | Icon only (no count per conversation) |

### Notifications
| Setting | Value |
|---------|-------|
| Desktop notification | On new message (shows first ~50 chars + contact name) |
| Sound | **Never** |
| Taskbar flash | **NEVER** (explicitly forbidden) |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New message |
| `Ctrl+W` | Close window |
| `Enter` | Send message |
| `Shift+Enter` | Newline in compose box |
| `Delete` | Soft delete selected conversation |
| `Shift+Delete` | Hard delete selected conversation |
| `Esc` | Close lightbox / cancel compose |

### Context Menus
**On conversation (right-click):**
- Set contact name
- Archive
- Delete (soft)
- Hard Delete (Shift+Delete)
- Mark all as read

**On message (right-click):**
- Save attachment (if MMS)

**On attachment (right-click):**
- Save as...

### Data Management
| Feature | Behavior |
|---------|----------|
| Export database | Copy SQLite file to user-specified location |
| Import database | Replace current DB with imported file (with confirmation) |
| Auto-delete messages | **Never** |
| Attachment cleanup | On message delete (cascade) |

### Single Instance
| Behavior | Value |
|----------|-------|
| Second launch attempt | Show notification: "App is already open" + bring existing window to front |
| Reason | Prevent database corruption from multiple instances |

### Rate Limiting
| Operation | Limit |
|-----------|-------|
| `sendSMS` / `sendMMS` | 100 per day (default, A2P verification for more) |
| `getMMS` (polling) | Unlimited |
| Strategy | Track sends locally, warn at 80/95/100, fallback to web portal |

---

## Database Schema

```sql
-- Dids (your DIDs)
CREATE TABLE dids (
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
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    did_id INTEGER NOT NULL,
    contact_number TEXT NOT NULL,
    contact_name TEXT,
    last_message_date TEXT,
    last_message_text TEXT,
    unread_count INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (did_id) REFERENCES dids(id) ON DELETE CASCADE,
    UNIQUE(did_id, contact_number)
);

-- Messages
CREATE TABLE messages (
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
CREATE TABLE attachments (
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
CREATE TABLE sent_messages_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    did_id INTEGER NOT NULL,
    dst TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('sms', 'mms')),
    status TEXT NOT NULL,
    voipms_id TEXT,
    FOREIGN KEY (did_id) REFERENCES dids(id)
);
```

---

## Project Phases (In Order)

### Phase 1: Foundation
1. Add SQLite (`better-sqlite3`)
2. Create database migration system
3. Build VoipMsClient wrapper class
4. Create MockVoipMsClient for testing
5. Implement polling service

### Phase 2: Core Features
6. Build DID management (Settings dialog)
7. Build conversation list (load, sort, select)
8. Build message thread (load, infinite scroll, display)
9. Implement read status logic (scroll-based)
10. Implement attachment auto-download

### Phase 3: Sending & Composition
11. Build compose box (text input, send button)
12. Implement `sendSMS`
13. Implement `sendMMS` (Base64 attachment encoding)
14. Build "New Message" dialog (DID picker, contact entry)

### Phase 4: Polish
15. Implement archive/unarchive
16. Implement soft/hard delete
17. Build lightbox for attachments
18. Add context menus
19. Add keyboard shortcuts
20. Add desktop notifications

### Phase 5: Data Management
21. Export database
22. Import database
23. Attachment cleanup on delete

---


## Notes & Decisions

- **No taskbar flash** — Explicitly forbidden (user will "kill you" if included)
- **No auto-delete** — "Never ever ever"
- **Single instance only** — Prevents database corruption
- **Auto-download MMS** — Phone app requires clicking links; this app won't
- **Scroll-based read status** — Only mark as read if conversation is visible AND app is focused


