// const MigrationRunner = require('../../src/main/db/MigrationRunner');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');

import MigrationRunner from '../../src/main/db/MigrationRunner.js';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

describe('MigrationRunner', () => {
  let testDbPath;

  beforeEach(() => {
    // Each test gets its own database file
    testDbPath = path.join(__dirname, `test-migrations-${Date.now()}.db`);
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('runs migrations on empty database', () => {
    const runner = new MigrationRunner(testDbPath);
    runner.run();

    const db = new Database(testDbPath);
    
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();

    const tableNames = tables.map(t => t.name);
    
    expect(tableNames).toContain('schema_migrations');
    expect(tableNames).toContain('accounts');
    expect(tableNames).toContain('conversations');
    expect(tableNames).toContain('messages');
    expect(tableNames).toContain('attachments');
    expect(tableNames).toContain('sent_messages_log');

    db.close();
  });

  test('does not re-apply migrations on second run', () => {
    const runner = new MigrationRunner(testDbPath);
    
    // First run
    runner.run();
    
    const db = new Database(testDbPath);
    const firstRun = db.prepare('SELECT * FROM schema_migrations').all();
    expect(firstRun.length).toBe(1);

    // Second run (should be no-op)
    runner.run();
    
    const secondRun = db.prepare('SELECT * FROM schema_migrations').all();
    expect(secondRun.length).toBe(1);

    db.close();
  });
});