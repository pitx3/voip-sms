const Database = require('better-sqlite3');
const path = require('path');

describe('SQLite Connection Smoke Test', () => {
  let db;
  const testDbPath = path.join(__dirname, 'test-smoke.db');

  beforeAll(() => {
    // Open database (creates file if doesn't exist)
    db = new Database(testDbPath);
  });

  afterAll(() => {
    db.close();
    // Clean up test database file
    const fs = require('fs');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('can open database', () => {
    expect(db).toBeDefined();
    expect(db.inTransaction).toBeDefined();
  });

  test('can run a simple query', () => {
    const result = db.prepare('SELECT 1 + 1 AS result').get();
    expect(result.result).toBe(2);
  });

  test('can create and query a table', () => {
    db.exec('CREATE TABLE IF NOT EXISTS smoke_test (id INTEGER PRIMARY KEY, value TEXT)');
    db.prepare('INSERT INTO smoke_test (value) VALUES (?)').run('hello');
    const row = db.prepare('SELECT * FROM smoke_test LIMIT 1').get();
    expect(row.value).toBe('hello');
  });
});