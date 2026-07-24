/**
 * Authentication endpoint tests
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

    CREATE TABLE IF NOT EXISTS case_counter (
      year INTEGER PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0
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

// Seed an admin user before tests
const ADMIN_ID = uuidv4();
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

beforeAll(() => {
  db.prepare(
    'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
  ).run(ADMIN_ID, 'Test Admin', 'admin@moj.na', ADMIN_HASH, 'admin');
});

describe('POST /api/auth/login', () => {
  it('returns 200 with token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@moj.na', password: ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('admin@moj.na');
    expect(res.body.data.user.role).toBe('admin');
  });

  it('sets httpOnly cookie on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@moj.na', password: ADMIN_PASSWORD });

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.includes('moj_token'))).toBe(true);
    expect(cookies.some(c => c.includes('HttpOnly'))).toBe(true);
    expect(cookies.some(c => c.includes('SameSite=Strict'))).toBe(true);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@moj.na', password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  describe('validation', () => {
    it('rejects missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: ADMIN_PASSWORD });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details).toBeDefined();
    });

    it('rejects missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@moj.na' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details).toBeDefined();
    });

    it('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: ADMIN_PASSWORD });

      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('email');
    });

    it('rejects short password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@moj.na', password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('password');
    });
  });
});

describe('POST /api/auth/register', () => {
  const newUser = { name: 'New Clerk', email: 'clerk@moj.na', password: 'Clerk@1234', role: 'clerk' };

  it('creates a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });
});
