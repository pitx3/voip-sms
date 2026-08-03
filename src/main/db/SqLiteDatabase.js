// src/main/db/SqliteDatabase.js

import { Database } from './Database.js';
import SQLite from 'better-sqlite3';
import { runMigrations } from './migrations.js';
import path from 'path';
import { app } from 'electron';

export default class SqliteDatabase extends Database {
  constructor(dbPath) {
    super();
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    // Initialize SQLite database
    this.db = new SQLite(this.dbPath);
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Run migrations
    await runMigrations(this.db);
    
    return this;
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // =========================================
  // DIDs
  // =========================================

  getDids() {
    const stmt = this.db.prepare('SELECT * FROM dids ORDER BY did');
    return stmt.all();
  }

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

  deleteDid(id) {
    const stmt = this.db.prepare('DELETE FROM dids WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Sync DIDs with Voip.ms
   * - Add new DIDs that don't exist locally
   * - Update existing DIDs
   * - Delete DIDs that no longer exist on Voip.ms
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
   * Sync messages to database (upsert by message_id + did_id)
   * @param {Array} messages - Array of message objects with did_id
   * @returns {Promise<{synced: number, new: number}>} Sync statistics
   */
  syncMessages(messages) {
    let newCount = 0;
    
    for (const msg of messages) {
      const result = await this.db.run(`
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
  // Settings
  // =============================================================================

  /**
   * Get a setting value by key
   * @param {string} key - Setting key
   * @returns {Promise<string|null>} Setting value or null if not found
   */
  getSetting(key) {
    const sql = 'SELECT value FROM settings WHERE key = ?';
    const result = await this.db.get(sql, [key]);
    return result ? result.value : null;
  }

  /**
   * Set a setting value (insert or update)
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   * @returns {Promise<void>}
   */
  setSetting(key, value) {
    const sql = `
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `;
    await this.db.run(sql, [key, value]);
  }
}