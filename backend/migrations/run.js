/**
 * Database migration runner
 *
 * Usage:
 *   node migrations/run.js          # Run all pending migrations
 *   node migrations/run.js --create  # Create a new migration file
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../src/config');

// ── Ensure data dir exists ──────────────────────────────────
const dataDir = path.dirname(config.db.path);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(config.db.path);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create migrations tracking table ────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const MIGRATIONS_DIR = __dirname;

// ── Create a new migration file ─────────────────────────────
if (process.argv.includes('--create')) {
  const name = process.argv.filter(a => !a.startsWith('--') && a !== 'run.js' && a !== 'node' && !a.includes('\\')).pop();
  const suffix = name || 'new_migration';
  const ts = new Date().toISOString().replace(/[T:.-]/g, '_').slice(0, 19);
  const filename = `${ts}_${suffix}.sql`;
  const template = `-- Migration: ${suffix}\n-- Up\n\n-- Down\n`;
  fs.writeFileSync(path.join(MIGRATIONS_DIR, filename), template);
  console.log(`Created migration: ${filename}`);
  process.exit(0);
}

// ── Run pending migrations ──────────────────────────────────
const applied = new Set(
  db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
);

const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql') && !f.startsWith('_'))
  .sort();

let ran = 0;

for (const file of files) {
  if (applied.has(file)) continue;

  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

  // Extract the "Up" section (everything before "-- Down" or the whole file)
  const upSql = sql.split('\n-- Down\n')[0].replace(/^-- Up\n/, '').trim();

  if (!upSql) {
    console.warn(`Skipping empty migration: ${file}`);
    continue;
  }

  try {
    db.exec(upSql);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
    console.log(`✅ Applied: ${file}`);
    ran++;
  } catch (err) {
    console.error(`❌ Failed: ${file} — ${err.message}`);
    process.exit(1);
  }
}

if (ran === 0) {
  console.log('✅ No pending migrations.');
} else {
  console.log(`✅ Applied ${ran} migration(s).`);
}

db.close();
