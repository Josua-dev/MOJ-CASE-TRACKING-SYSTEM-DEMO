/**
 * Cases API endpoint tests
 *
 * Uses jest.mock() to replace ../db/database with an in-memory SQLite
 * instance for test isolation. The mock factory creates the DB inline
 * to avoid the hoisting restriction (jest.mock cannot reference outer variables).
 */
jest.mock('../db/database', () => {
  const Database = require('better-sqlite3');
  const d = new Database(':memory:');
  d.pragma('journal_mode = WAL');
  d.pragma('foreign_keys = ON');

  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'clerk',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY,
      in_app INTEGER NOT NULL DEFAULT 1,
      email INTEGER NOT NULL DEFAULT 0
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

    CREATE TABLE IF NOT EXISTS case_counter (
      year INTEGER PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT DEFAULT '',
      link TEXT DEFAULT '',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return {
    db: d,
    getNextCaseNumber: jest.fn(() => {
      const year = new Date().getFullYear();
      const row = d.prepare('SELECT count FROM case_counter WHERE year = ?').get(year);
      const next = (row?.count || 0) + 1;
      d.prepare(
        'INSERT INTO case_counter (year, count) VALUES (?, ?) ON CONFLICT(year) DO UPDATE SET count = ?'
      ).run(year, next, next);
      return `MOJ-${year}-${String(next).padStart(4, '0')}`;
    }),
  };
});

require('./setup');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const app = require('../server');

let token;
let caseId;
const ADMIN_ID = uuidv4();

beforeAll(() => {
  // Seed admin user
  const hash = bcrypt.hashSync('Admin@1234', 10);
  db.prepare(
    'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
  ).run(ADMIN_ID, 'Test Admin', 'admin@moj.na', hash, 'admin');

  // Seed the counter for the current year
  const year = new Date().getFullYear();
  db.prepare('INSERT OR IGNORE INTO case_counter (year, count) VALUES (?, 0)').run(year);
});

beforeEach(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@moj.na', password: 'Admin@1234' });
  token = res.body.data.token;
});

describe('POST /api/cases — create case', () => {
  it('creates a case successfully', async () => {
    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${token}`)
      .set('x-csrf-token', 'bypass-test')
      .send({
        title: 'State v. Accused',
        case_type: 'Criminal',
        plaintiff: 'State',
        defendant: 'John Doe',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('case_number');
    expect(res.body.data.case_number).toMatch(/^MOJ-\d{4}-\d{4}$/);
    caseId = res.body.data.id;
  });

  it('creates case with MOJ-YYYY-XXXX format', async () => {
    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${token}`)
      .set('x-csrf-token', 'bypass-test')
      .send({
        title: 'Civil Dispute',
        plaintiff: 'Alice',
        defendant: 'Bob',
      });

    expect(res.body.data.case_number).toMatch(/^MOJ-\d{4}-\d{4}$/);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${token}`)
      .set('x-csrf-token', 'bypass-test')
      .send({ title: 'Incomplete' });

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
    expect(res.body.details.some(d => d.field === 'plaintiff')).toBe(true);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/cases')
      .send({ title: 'Test', plaintiff: 'A', defendant: 'B' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/cases — list cases', () => {
  it('returns paginated cases', async () => {
    const res = await request(app)
      .get('/api/cases')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('page');
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('totalPages');
  });

  it('supports search parameter', async () => {
    const res = await request(app)
      .get('/api/cases?search=State')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('supports filtering by status', async () => {
    // Set status on the pre-created case first
    await request(app)
      .put(`/api/cases/${caseId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-csrf-token', 'bypass-test')
      .send({ status: 'Open' });

    const res = await request(app)
      .get('/api/cases?status=Open')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(c => {
      expect(c.status).toBe('Open');
    });
  });

  it('supports pagination parameters', async () => {
    const res = await request(app)
      .get('/api/cases?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
    expect(res.body.meta.limit).toBe(1);
    expect(res.body.meta.page).toBe(1);
  });

  it('supports sorting', async () => {
    const res = await request(app)
      .get('/api/cases?sort_by=created_at&sort_order=asc')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/cases/:id — case detail', () => {
  it('returns case with audit logs', async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('State v. Accused');
    expect(res.body.data).toHaveProperty('logs');
    expect(Array.isArray(res.body.data.logs)).toBe(true);
    expect(res.body.data.logs.some(l => l.action === 'Case Created')).toBe(true);
  });

  it('returns 404 for non-existent case', async () => {
    const res = await request(app)
      .get('/api/cases/non-existent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('PUT /api/cases/:id — update case', () => {
  it('updates case status and logs the change', async () => {
    const res = await request(app)
      .put(`/api/cases/${caseId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-csrf-token', 'bypass-test')
      .send({ status: 'Active' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify the audit log was created
    const detailRes = await request(app)
      .get(`/api/cases/${caseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailRes.body.data.logs.some(l => l.action === 'Status Updated')).toBe(true);
  });

  it('rejects updating non-existent case', async () => {
    const res = await request(app)
      .put('/api/cases/fake-id')
      .set('Authorization', `Bearer ${token}`)
      .set('x-csrf-token', 'bypass-test')
      .send({ status: 'Closed' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/cases/meta/stats — dashboard stats', () => {
  it('returns aggregate statistics', async () => {
    const res = await request(app)
      .get('/api/cases/meta/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('byType');
    expect(res.body.data).toHaveProperty('recent');
    expect(typeof res.body.data.total).toBe('number');
  });
});

describe('GET /api/cases/export/csv — CSV export', () => {
  it('returns CSV file', async () => {
    const res = await request(app)
      .get('/api/cases/export/csv')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('Case Number');
    expect(res.text).toContain('Title');
  });
});
