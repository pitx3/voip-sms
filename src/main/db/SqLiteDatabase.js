// src/main/db/SqliteDatabase.js

import { Database } from './Database.js';
import SQLite from 'better-sqlite3';
import { runMigrations } from './migrations.js';
import path from 'path';
import { app } from 'electron';

export default class SqliteDatabase extends Database {
  constructor(dbPath) {
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
  // Accounts (DIDs)
  // =========================================

  getAccounts() {
    const stmt = this.db.prepare('SELECT * FROM accounts ORDER BY did');
    return stmt.all();
  }

  addAccount(account) {
    const stmt = this.db.prepare(`
      INSERT INTO accounts (did, name, description, sms_enabled, mms_enabled, last_sync_date, created_at, updated_at)
      VALUES (@did, @name, @description, @sms_enabled, @mms_enabled, @last_sync_date, @created_at, @updated_at)
    `);

    const now = new Date().toISOString();
    const result = stmt.run({
      did: account.did,
      name: account.name || null,
      description: account.description || '',
      sms_enabled: account.sms_enabled ?? 1,
      mms_enabled: account.mms_enabled ?? 1,
      last_sync_date: account.last_sync_date || null,
      created_at: now,
      updated_at: now
    });

    return {
      id: result.lastInsertRowid,
      did: account.did,
      name: account.name || null,
      description: account.description || '',
      sms_enabled: account.sms_enabled ?? 1,
      mms_enabled: account.mms_enabled ?? 1,
      last_sync_date: account.last_sync_date || null,
      created_at: now,
      updated_at: now
    };
  }

  updateAccount(id, updates) {
    const existing = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
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
      UPDATE accounts SET ${fields.join(', ')} WHERE id = @id
    `);

    stmt.run({ ...values, id });

    return this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
  }

  deleteAccount(id) {
    const stmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Sync accounts with Voip.ms DIDs
   * - Add new DIDs that don't exist locally
   * - Update existing DIDs
   * - Delete DIDs that no longer exist on Voip.ms
   */
  syncAccounts(didsFromVoipms) {
    const existingAccounts = this.getAccounts();
    const existingDidMap = new Map(existingAccounts.map(a => [a.did, a]));

    const voipmsDidSet = new Set();

    // Add or update each DID from Voip.ms
    for (const did of didsFromVoipms) {
      voipmsDidSet.add(did.did);

      const existing = existingDidMap.get(did.did);
      if (existing) {
        // Update existing account
        this.updateAccount(existing.id, {
          name: did.name || existing.name,
          description: did.description || existing.description,
          sms_enabled: did.sms_enabled ?? existing.sms_enabled,
          mms_enabled: did.mms_enabled ?? existing.mms_enabled,
          last_sync_date: new Date().toISOString()
        });
      } else {
        // Add new account
        this.addAccount({
          did: did.did,
          name: did.name || null,
          description: did.description || '',
          sms_enabled: did.sms_enabled ?? 1,
          mms_enabled: did.mms_enabled ?? 1,
          last_sync_date: new Date().toISOString()
        });
      }
    }

    // Delete accounts that no longer exist on Voip.ms
    for (const account of existingAccounts) {
      if (!voipmsDidSet.has(account.did)) {
        this.deleteAccount(account.id);
      }
    }
  }
}