/**
 * Database setup — SQLite via better-sqlite3
 */
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../src/config');

// Ensure data directory exists
const dataDir = path.dirname(config.db.path);
const fs = require('fs');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(config.db.path);

// Performance & integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ──────────────────────────────────────────────
// Schema (idempotent — safe to re-run)
// ──────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'clerk',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    case_type TEXT NOT NULL DEFAULT 'Criminal',
    status TEXT NOT NULL DEFAULT 'Open',
    priority TEXT NOT NULL DEFAULT 'Medium',
    plaintiff TEXT NOT NULL,
    defendant TEXT NOT NULL,
    presiding_officer TEXT DEFAULT '',
    hearing_date TEXT DEFAULT '',
    next_action TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS case_logs (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    note TEXT DEFAULT '',
    performed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Atomic case-number counter (one row per year)
  CREATE TABLE IF NOT EXISTS case_counter (
    year INTEGER PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  );

  -- Visualisations (BI module)
  CREATE TABLE IF NOT EXISTS visualisations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    chart_type TEXT NOT NULL DEFAULT 'bar',
    data_source TEXT NOT NULL DEFAULT 'cases/byType',
    config TEXT NOT NULL DEFAULT '{}',
    refresh_interval INTEGER DEFAULT 0,
    colour_theme TEXT DEFAULT 'default',
    chart_size TEXT DEFAULT 'medium',
    animation_enabled INTEGER DEFAULT 1,
    auto_refresh INTEGER DEFAULT 0,
    fullscreen_support INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    is_favourite INTEGER DEFAULT 0,
    category TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS visualisation_filters (
    id TEXT PRIMARY KEY,
    visualisation_id TEXT NOT NULL REFERENCES visualisations(id) ON DELETE CASCADE,
    filter_type TEXT NOT NULL,
    filter_value TEXT NOT NULL,
    enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS playlist_items (
    id TEXT PRIMARY KEY,
    playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    visualisation_id TEXT NOT NULL REFERENCES visualisations(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 30
  );

  CREATE TABLE IF NOT EXISTS vis_views (
    id TEXT PRIMARY KEY,
    visualisation_id TEXT NOT NULL REFERENCES visualisations(id) ON DELETE CASCADE,
    viewed_by TEXT REFERENCES users(id),
    viewed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courtrooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT DEFAULT '',
    capacity INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS court_sessions (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    courtroom_id TEXT REFERENCES courtrooms(id),
    magistrate TEXT DEFAULT '',
    session_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT DEFAULT '',
    session_type TEXT DEFAULT 'Hearing',
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'Scheduled',
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size INTEGER NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    category TEXT DEFAULT '',
    uploaded_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT DEFAULT '',
    link TEXT DEFAULT '',
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    in_app INTEGER NOT NULL DEFAULT 1,
    email_alerts INTEGER NOT NULL DEFAULT 0,
    case_updates INTEGER NOT NULL DEFAULT 1,
    new_sessions INTEGER NOT NULL DEFAULT 1,
    document_uploads INTEGER NOT NULL DEFAULT 1,
    system_alerts INTEGER NOT NULL DEFAULT 1
  );
`);

// Add court column to cases (idempotent — ignore if already exists)
try {
  db.prepare("ALTER TABLE cases ADD COLUMN court TEXT DEFAULT ''").run();
} catch (_) { /* column may already exist */ }

// Add active column to users (idempotent)
try {
  db.prepare("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1").run();
} catch (_) { /* column may already exist */ }

// Migrate case_logs: rename performed_by → user_id if needed
try {
  const cols = db.prepare("PRAGMA table_info(case_logs)").all().map(c => c.name);
  if (cols.includes('performed_by') && !cols.includes('user_id')) {
    db.prepare("ALTER TABLE case_logs ADD COLUMN user_id TEXT REFERENCES users(id)").run();
    db.prepare("UPDATE case_logs SET user_id = performed_by WHERE user_id IS NULL").run();
    console.log('✅ Migrated case_logs: added user_id column from performed_by data.');
  } else if (!cols.includes('user_id')) {
    db.prepare("ALTER TABLE case_logs ADD COLUMN user_id TEXT REFERENCES users(id)").run();
    console.log('✅ Added user_id column to case_logs.');
  }
  // Make performed_by nullable (SQLite requires table recreation)
  const pcol = db.prepare("PRAGMA table_info(case_logs)").all().find(c => c.name === 'performed_by');
  if (pcol && pcol.notnull) {
    db.exec(`
      CREATE TABLE case_logs_new (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id),
        action TEXT NOT NULL,
        note TEXT DEFAULT '',
        performed_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO case_logs_new (id, case_id, user_id, action, note, performed_at)
        SELECT id, case_id, user_id, action, note, performed_at FROM case_logs;
      DROP TABLE case_logs;
      ALTER TABLE case_logs_new RENAME TO case_logs;
    `);
    console.log('✅ Migrated case_logs: removed performed_by column.');
  }
} catch (_) { /* migration may already be done */ }

// ──────────────────────────────────────────────
// FTS5 Full-Text Search virtual tables
// ──────────────────────────────────────────────

// Enable FTS5 extension (built-in with better-sqlite3)
try {
  db.exec(`
    -- Cases FTS: search case_number, title, description, parties, officer
    CREATE VIRTUAL TABLE IF NOT EXISTS cases_fts USING fts5(
      case_number, title, description, plaintiff, defendant, presiding_officer, case_type, status,
      content='cases',
      content_rowid='rowid',
      tokenize='porter unicode61'
    );

    -- Documents FTS: search file names and categories
    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      original_name, category,
      content='documents',
      content_rowid='rowid',
      tokenize='porter unicode61'
    );

    -- Case logs FTS: search action descriptions and notes
    CREATE VIRTUAL TABLE IF NOT EXISTS case_logs_fts USING fts5(
      action, note,
      content='case_logs',
      content_rowid='rowid',
      tokenize='porter unicode61'
    );
  `);

  // ── Triggers to keep FTS indexes in sync ────

  // Cases
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cases_ai AFTER INSERT ON cases BEGIN
      INSERT INTO cases_fts(rowid, case_number, title, description, plaintiff, defendant, presiding_officer, case_type, status)
      VALUES (new.rowid, new.case_number, new.title, new.description, new.plaintiff, new.defendant, new.presiding_officer, new.case_type, new.status);
    END;
  `);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cases_ad AFTER DELETE ON cases BEGIN
      INSERT INTO cases_fts(cases_fts, rowid, case_number, title, description, plaintiff, defendant, presiding_officer, case_type, status)
      VALUES ('delete', old.rowid, old.case_number, old.title, old.description, old.plaintiff, old.defendant, old.presiding_officer, old.case_type, old.status);
    END;
  `);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cases_au AFTER UPDATE ON cases BEGIN
      INSERT INTO cases_fts(cases_fts, rowid, case_number, title, description, plaintiff, defendant, presiding_officer, case_type, status)
      VALUES ('delete', old.rowid, old.case_number, old.title, old.description, old.plaintiff, old.defendant, old.presiding_officer, old.case_type, old.status);
      INSERT INTO cases_fts(rowid, case_number, title, description, plaintiff, defendant, presiding_officer, case_type, status)
      VALUES (new.rowid, new.case_number, new.title, new.description, new.plaintiff, new.defendant, new.presiding_officer, new.case_type, new.status);
    END;
  `);

  // Documents
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
      INSERT INTO documents_fts(rowid, original_name, category)
      VALUES (new.rowid, new.original_name, new.category);
    END;
  `);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, original_name, category)
      VALUES ('delete', old.rowid, old.original_name, old.category);
    END;
  `);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, original_name, category)
      VALUES ('delete', old.rowid, old.original_name, old.category);
      INSERT INTO documents_fts(rowid, original_name, category)
      VALUES (new.rowid, new.original_name, new.category);
    END;
  `);

  // Case logs
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS case_logs_ai AFTER INSERT ON case_logs BEGIN
      INSERT INTO case_logs_fts(rowid, action, note)
      VALUES (new.rowid, new.action, new.note);
    END;
  `);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS case_logs_ad AFTER DELETE ON case_logs BEGIN
      INSERT INTO case_logs_fts(case_logs_fts, rowid, action, note)
      VALUES ('delete', old.rowid, old.action, old.note);
    END;
  `);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS case_logs_au AFTER UPDATE ON case_logs BEGIN
      INSERT INTO case_logs_fts(case_logs_fts, rowid, action, note)
      VALUES ('delete', old.rowid, old.action, old.note);
      INSERT INTO case_logs_fts(rowid, action, note)
      VALUES (new.rowid, new.action, new.note);
    END;
  `);

  // ── Initial FTS index population ────────────
  // Always rebuild on startup to ensure the index matches content tables.
  // This is fast on SQLite and works for both fresh and existing tables.
  try {
    db.exec("INSERT INTO cases_fts(cases_fts) VALUES('rebuild')");
    db.exec("INSERT INTO documents_fts(documents_fts) VALUES('rebuild')");
    db.exec("INSERT INTO case_logs_fts(case_logs_fts) VALUES('rebuild')");
  } catch (_) {
    // Tables may be empty on first run (no content yet), which is fine
  }

  console.log('✅ FTS5 full-text search indexes ready.');
} catch (e) {
  console.warn('⚠️ FTS5 not available — full-text search disabled.', e.message);
}

// ──────────────────────────────────────────────
// Atomic case-number generator
// ──────────────────────────────────────────────
const getNextCaseNumber = db.transaction(() => {
  const year = new Date().getFullYear();
  const row = db.prepare('SELECT count FROM case_counter WHERE year = ?').get(year);
  const next = (row?.count || 0) + 1;
  db.prepare(
    'INSERT INTO case_counter (year, count) VALUES (?, ?) ON CONFLICT(year) DO UPDATE SET count = ?'
  ).run(year, next, next);
  return `MOJ-${year}-${String(next).padStart(4, '0')}`;
});

// ──────────────────────────────────────────────
// Seed data (first run only)
// ──────────────────────────────────────────────

const adminExists = db.prepare("SELECT id FROM users WHERE email = 'admin@moj.na'").get();

if (!adminExists) {
  const adminId = uuidv4();
  const hashedPassword = bcrypt.hashSync('Admin@1234', 10);

  db.prepare(
    'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
  ).run(adminId, 'Admin User', 'admin@moj.na', hashedPassword, 'admin');

  const sampleCases = [
    { title: 'State v. John Amutenya', type: 'Criminal', status: 'Active', priority: 'High', plaintiff: 'State of Namibia', defendant: 'John Amutenya', officer: 'Magistrate Shikongo', date: '2026-02-15' },
    { title: 'Nangula v. Nghipondoka', type: 'Civil', status: 'Open', priority: 'Medium', plaintiff: 'Selma Nangula', defendant: 'Tomas Nghipondoka', officer: 'Magistrate Shikongo', date: '2026-03-01' },
    { title: 'In re: Estate of Hendrik Witbooi', type: 'Family', status: 'Pending', priority: 'Medium', plaintiff: 'Estate', defendant: 'Beneficiaries', officer: 'Magistrate Katoma', date: '' },
    { title: 'Shoprite v. Kangombe Construction', type: 'Commercial', status: 'Active', priority: 'High', plaintiff: 'Shoprite Namibia', defendant: 'Kangombe Construction', officer: 'Magistrate Katoma', date: '2026-01-20' },
    { title: 'Minister of Labour v. NamGrow Farms', type: 'Labour', status: 'Closed', priority: 'Low', plaintiff: 'Minister of Labour', defendant: 'NamGrow Farms', officer: 'Magistrate Shikongo', date: '' },
  ];

  for (const c of sampleCases) {
    const caseId = uuidv4();
    const caseNumber = getNextCaseNumber();
    db.prepare(`
      INSERT INTO cases (id, case_number, title, case_type, status, priority, plaintiff, defendant, presiding_officer, hearing_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(caseId, caseNumber, c.title, c.type, c.status, c.priority, c.plaintiff, c.defendant, c.officer, c.date, adminId);

    db.prepare(`
      INSERT INTO case_logs (id, case_id, user_id, action, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), caseId, adminId, 'Case Created', 'Initial filing recorded.');
  }

  console.log('✅ Database seeded: admin user + 5 sample cases.');
}

// ── Seed notification preferences for all users ───────
const usersWithoutPrefs = db.prepare(`
  SELECT u.id FROM users u
  LEFT JOIN notification_preferences np ON np.user_id = u.id
  WHERE np.id IS NULL
`).all();
for (const u of usersWithoutPrefs) {
  db.prepare('INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)').run(uuidv4(), u.id);
}

module.exports = { db, getNextCaseNumber };
