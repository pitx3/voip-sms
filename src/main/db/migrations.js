// src/main/db/migrations.js

import fs from 'fs';
import path from 'path';

/**
 * Run all pending migrations on the given database connection
 * @param {Database} db - better-sqlite3 database instance
 */
export function runMigrations(db) {
  // Ensure migrations tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Get already applied migrations
  const applied = db
    .prepare('SELECT migration_name FROM schema_migrations')
    .all()
    .map(row => row.migration_name);

  // Find all migration files
  const migrationsDir = path.join(__dirname, '../../migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Apply pending migrations
  for (const file of migrationFiles) {
    if (!applied.includes(file)) {
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');

      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (migration_name) VALUES (?)').run(file);

      console.log(`Applied migration: ${file}`);
    }
  }
}