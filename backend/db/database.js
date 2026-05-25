const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/magistrate.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'clerk',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    case_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    priority TEXT NOT NULL DEFAULT 'Medium',
    plaintiff TEXT NOT NULL,
    defendant TEXT NOT NULL,
    presiding_officer TEXT,
    assigned_to TEXT,
    hearing_date TEXT,
    next_action TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS case_logs (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    action TEXT NOT NULL,
    note TEXT,
    performed_by TEXT NOT NULL,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id)
  );
`);

// Seed default admin user
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@moj.na');
if (!existing) {
  const hash = bcrypt.hashSync('Admin@1234', 10);
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 'System Administrator', 'admin@moj.na', hash, 'admin'
  );

  // Seed sample cases
  const cases = [
    { id: uuidv4(), case_number: 'MOJ-2026-0001', title: 'State v. Nghifikepunye', description: 'Armed robbery charge at Katutura shopping centre.', case_type: 'Criminal', status: 'Active', priority: 'High', plaintiff: 'State of Namibia', defendant: 'Petrus Nghifikepunye', presiding_officer: 'Magistrate L. Shikongo', hearing_date: '2026-06-10', next_action: 'Witness testimony' },
    { id: uuidv4(), case_number: 'MOJ-2026-0002', title: 'Haimbodi v. City of Windhoek', description: 'Land dispute over communal plot in Khomasdal.', case_type: 'Civil', status: 'Open', priority: 'Medium', plaintiff: 'Anna Haimbodi', defendant: 'City of Windhoek', presiding_officer: 'Magistrate T. Amukoto', hearing_date: '2026-06-18', next_action: 'Documentary evidence submission' },
    { id: uuidv4(), case_number: 'MOJ-2026-0003', title: 'Ndapewa v. Ndapewa', description: 'Divorce and child custody proceedings.', case_type: 'Family', status: 'Active', priority: 'Medium', plaintiff: 'Maria Ndapewa', defendant: 'Josef Ndapewa', presiding_officer: 'Magistrate R. Kauari', hearing_date: '2026-05-30', next_action: 'Mediation session' },
    { id: uuidv4(), case_number: 'MOJ-2026-0004', title: 'State v. Kamati', description: 'Fraud and misappropriation of public funds.', case_type: 'Criminal', status: 'Closed', priority: 'High', plaintiff: 'State of Namibia', defendant: 'Eino Kamati', presiding_officer: 'Magistrate L. Shikongo', hearing_date: '2026-04-20', next_action: 'Sentencing complete' },
    { id: uuidv4(), case_number: 'MOJ-2026-0005', title: 'Tjivikua Trading v. Shiimi Logistics', description: 'Breach of supply contract dispute.', case_type: 'Civil', status: 'Pending', priority: 'Low', plaintiff: 'Tjivikua Trading CC', defendant: 'Shiimi Logistics Ltd', presiding_officer: 'Magistrate T. Amukoto', hearing_date: '2026-07-05', next_action: 'Awaiting defendant response' },
  ];

  const adminId = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@moj.na').id;
  const insertCase = db.prepare(`INSERT INTO cases (id, case_number, title, description, case_type, status, priority, plaintiff, defendant, presiding_officer, hearing_date, next_action, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  cases.forEach(c => insertCase.run(c.id, c.case_number, c.title, c.description, c.case_type, c.status, c.priority, c.plaintiff, c.defendant, c.presiding_officer, c.hearing_date, c.next_action, adminId));
}

module.exports = db;
