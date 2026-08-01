// const Database = require('better-sqlite3');
// const fs = require('fs');
// const path = require('path');

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

class MigrationRunner {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  run() {
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    
    this._ensureMigrationsTable();
    this._runPendingMigrations();
    
    this.db.close();
    this.db = null;
  }

  _ensureMigrationsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_name TEXT PRIMARY KEY,
        applied_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }

  _runPendingMigrations() {
    const migrationsDir = path.join(__dirname, '../../..', 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const applied = this.db
      .prepare('SELECT migration_name FROM schema_migrations')
      .all()
      .map(row => row.migration_name);

    for (const file of migrationFiles) {
      if (!applied.includes(file)) {
        const sqlPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        this.db.exec(sql);
        this.db
          .prepare('INSERT INTO schema_migrations (migration_name) VALUES (?)')
          .run(file);
        
        console.log(`Applied migration: ${file}`);
      }
    }
  }
}

export default MigrationRunner;