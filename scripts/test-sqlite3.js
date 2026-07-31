const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const testDbPath = path.join(__dirname, '..', 'test-smoke.db');

console.log('Opening database at:', testDbPath);

try {
  const db = new Database(testDbPath);
  console.log('✓ Database opened successfully');

  const result = db.prepare('SELECT 1 + 1 AS result').get();
  console.log('✓ Simple query result:', result.result);

  db.exec('CREATE TABLE IF NOT EXISTS smoke_test (id INTEGER PRIMARY KEY, value TEXT)');
  db.prepare('INSERT INTO smoke_test (value) VALUES (?)').run('hello');
  const row = db.prepare('SELECT * FROM smoke_test LIMIT 1').get();
  console.log('✓ Table created and queried:', row.value);

  db.close();
  console.log('✓ Database closed');

  // Cleanup
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('✓ Test database cleaned up');
  }

  console.log('\n✅ All smoke tests passed!');
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}