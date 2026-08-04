// src/main/db/SqLiteDatabase.js

const Database = require('./Database');
const BetterSqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * SQLite implementation of the Database abstraction using better-sqlite3.
 * All methods are synchronous - better-sqlite3 is a synchronous library.
 */
class SqLiteDatabase extends Database {
  /**
   * Create a new SqLiteDatabase instance.
   * @param {string} dbPath - Path to the SQLite database file.
   */
  constructor(dbPath) {
    super();
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new BetterSqlite3(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Initialize the database by running pending migrations.
   * Creates the migrations table if it doesn't exist.
   */
  init() {
    const migrations = require('./migrations');
    
    // Create migrations table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Run pending migrations
    for (const migration of migrations) {
      const stmt = this.db.prepare('SELECT 1 FROM migrations WHERE name = ?');
      const exists = stmt.get(migration.name);
      
      if (!exists) {
        this.db.exec(migration.sql);
        const insert = this.db.prepare('INSERT INTO migrations (name) VALUES (?)');
        insert.run(migration.name);
      }
    }
  }

  // =============================================================================
  // DIDs
  // =============================================================================

  /**
   * Get all DIDs from the database.
   * @returns {Array} Array of DID objects.
   */
  getDids() {
    const stmt = this.db.prepare('SELECT * FROM dids ORDER BY did');
    return stmt.all();
  }

  /**
   * Add a new DID to the database.
   * @param {Object} did - DID object with did, name, description, etc.
   * @returns {Object} The inserted DID with all fields including id and timestamps.
   */
  addDid(did) {
    const stmt = this.db.prepare(`
      INSERT INTO dids (did, name, description, sms_enabled, mms_enabled, last_sync_date, created_at, updated_at)
      VALUES (@did, @name, @description, @sms_enabled, @mms_enabled, @last_sync_date, @created_at, @updated_at)
    `);

    const now = new Date().toISOString();
    const result = stmt.run({
      did: did.did,
      name: did.name || null,
      description: did.description || '',
      sms_enabled: did.sms_enabled ?? 1,
      mms_enabled: did.mms_enabled ?? 1,
      last_sync_date: did.last_sync_date || null,
      created_at: now,
      updated_at: now
    });

    return {
      id: result.lastInsertRowid,
      did: did.did,
      name: did.name || null,
      description: did.description || '',
      sms_enabled: did.sms_enabled ?? 1,
      mms_enabled: did.mms_enabled ?? 1,
      last_sync_date: did.last_sync_date || null,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Update an existing DID.
   * @param {number} id - DID ID to update.
   * @param {Object} updates - Fields to update.
   * @returns {Object|null} Updated DID object or null if not found.
   */
  updateDid(id, updates) {
    const existing = this.db.prepare('SELECT * FROM dids WHERE id = ?').get(id);
    if (!existing) return null;

    const fields = [];
    const values = {};

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = @${key}`);
        values[key] = value;
      }
    }

    if (fields.length === 0) return existing;

    values.updated_at = new Date().toISOString();
    fields.push('updated_at = @updated_at');

    const stmt = this.db.prepare(`
      UPDATE dids SET ${fields.join(', ')} WHERE id = @id
    `);

    stmt.run({ ...values, id });

    return this.db.prepare('SELECT * FROM dids WHERE id = ?').get(id);
  }

  /**
   * Delete a DID by ID.
   * @param {number} id - DID ID to delete.
   */
  deleteDid(id) {
    const stmt = this.db.prepare('DELETE FROM dids WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Sync DIDs with Voip.ms.
   * - Add new DIDs that don't exist locally
   * - Update existing DIDs
   * - Delete DIDs that no longer exist on Voip.ms
   * @param {Array} didsFromVoipms - Array of DID objects from Voip.ms API.
   */
  syncDids(didsFromVoipms) {
    const existingDids = this.getDids();
    const existingDidMap = new Map(existingDids.map(d => [d.did, d]));

    const voipmsDidSet = new Set();

    // Add or update each DID from Voip.ms
    for (const did of didsFromVoipms) {
      voipmsDidSet.add(did.did);

      const existing = existingDidMap.get(did.did);
      if (existing) {
        // Update existing DID
        this.updateDid(existing.id, {
          name: did.name || existing.name,
          description: did.description || existing.description,
          sms_enabled: did.sms_enabled ?? existing.sms_enabled,
          mms_enabled: did.mms_enabled ?? existing.mms_enabled,
          last_sync_date: new Date().toISOString()
        });
      } else {
        // Add new DID
        this.addDid({
          did: did.did,
          name: did.name || null,
          description: did.description || '',
          sms_enabled: did.sms_enabled ?? 1,
          mms_enabled: did.mms_enabled ?? 1,
          last_sync_date: new Date().toISOString()
        });
      }
    }

    // Delete DIDs that no longer exist on Voip.ms
    for (const existingDid of existingDids) {
      if (!voipmsDidSet.has(existingDid.did)) {
        this.deleteDid(existingDid.id);
      }
    }
  }

  // =============================================================================
  // Messages
  // =============================================================================

  /**
   * Get messages from the database with optional filtering.
   * @param {Object} options - Query options.
   * @param {number} [options.didId] - Filter by DID ID.
   * @param {number} [options.contactId] - Filter by contact ID.
   * @param {number} [options.from] - Filter messages from this timestamp (inclusive).
   * @param {number} [options.to] - Filter messages to this timestamp (inclusive).
   * @param {number} [options.limit] - Maximum number of messages to return.
   * @returns {Array} Array of message rows (raw database format).
   */
  getMessages(options = {}) {
    const { didId, contactId, from, to, limit } = options;
    
    let query = 'SELECT * FROM messages WHERE 1=1';
    const params = [];
    
    if (didId) {
      query += ' AND did_id = ?';
      params.push(didId);
    }
    
    if (contactId) {
      query += ' AND contact_id = ?';
      params.push(contactId);
    }
    
    if (from) {
      query += ' AND timestamp >= ?';
      params.push(from);
    }
    
    if (to) {
      query += ' AND timestamp <= ?';
      params.push(to);
    }
    
    query += ' ORDER BY timestamp ASC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);
    return rows;
  }

  /**
   * Save messages to database (upsert by message_id + did_id).
   * @param {Array} messages - Array of message objects with did_id.
   * @returns {{synced: number, new: number}} Sync statistics.
   */
  saveMessages(messages) {
    let newCount = 0;
    
    for (const msg of messages) {
      const result = this.db.run(`
        INSERT OR IGNORE INTO messages (
          did_id, message_id, direction, contact_number,
          message_body, timestamp, carrier_status, media_urls, is_read
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        msg.did_id,
        msg.message_id,
        msg.direction,
        msg.contact_number,
        msg.message_body,
        msg.timestamp,
        msg.carrier_status,
        msg.media_urls,
        msg.is_read
      ]);
      
      if (result.changes > 0) {
        newCount++;
      }
    }
    
    return {
      synced: messages.length,
      new: newCount
    };
  }

  // =============================================================================
  // Contacts
  // =============================================================================

  /**
   * Get a contact by phone number.
   * @param {string} phoneNumber - Phone number to look up.
   * @returns {Object|null} Contact object or null if not found.
   */
  getContact(phoneNumber) {
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE phone_number = ?');
    const contact = stmt.get(phoneNumber);
    return contact || null;
  }

  /**
   * Add a new contact to the database.
   * @param {Object} contact - Contact object with name, phone_number, notes.
   * @returns {number} The ID of the newly inserted contact.
   */
  addContact(contact) {
    const stmt = this.db.prepare(`
      INSERT INTO contacts (name, phone_number, notes)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(contact.name, contact.phone_number, contact.notes || null);
    return result.lastInsertRowid;
  }

  /**
   * Update an existing contact.
   * @param {number} id - Contact ID to update.
   * @param {Object} contact - Contact object with name, phone_number, notes.
   * @returns {boolean} True if contact was updated, false otherwise.
   */
  updateContact(id, contact) {
    const stmt = this.db.prepare(`
      UPDATE contacts
      SET name = ?, phone_number = ?, notes = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(contact.name, contact.phone_number, contact.notes || null, id);
    return result.changes > 0;
  }

  /**
   * Delete a contact by ID.
   * @param {number} id - Contact ID to delete.
   * @returns {boolean} True if contact was deleted, false otherwise.
   */
  deleteContact(id) {
    const stmt = this.db.prepare('DELETE FROM contacts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // =============================================================================
  // Settings
  // =============================================================================

  /**
   * Get a setting value by key.
   * @param {string} key - Setting key.
   * @returns {string|null} Setting value or null if not found.
   */
  getSetting(key) {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null;
  }

  /**
   * Set a setting value by key (INSERT OR REPLACE).
   * @param {string} key - Setting key.
   * @param {string} value - Setting value.
   */
  setSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value)
      VALUES (?, ?)
    `);
    stmt.run(key, value);
  }

  /**
   * Close the database connection.
   */
  close() {
    this.db.close();
  }
}

module.exports = SqLiteDatabase;