/**
 * User management routes — admin only
 */
const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const { db } = require('../db/database');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const logger = require('../src/logger');
const { success, error } = require('../src/response');
const { NotFoundError } = require('../src/errors');

const router = Router();
router.use(auth);
router.use(admin);

// ── GET /api/users — list all users ────────────────────────
router.get('/', (req, res) => {
  const users = db.prepare(
    'SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC'
  ).all();
  return success(res, users);
});

// ── POST /api/users — create user ──────────────────────────
router.post('/', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return error(res, 400, 'Name, email, and password are required.');

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return error(res, 409, 'A user with this email already exists.');

  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  const userRole = ['admin', 'manager', 'clerk'].includes(role) ? role : 'clerk';

  db.prepare(
    'INSERT INTO users (id, name, email, password, role, active) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(id, name, email, hashed, userRole);

  logger.info({ userId: id, createdBy: req.user.id }, 'User created');
  return success(res, { id, name, email, role: userRole }, {}, 201);
});

// ── PUT /api/users/:id — update user ──────────────────────
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('User');

  const { name, email, role, password, active } = req.body;
  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (role !== undefined && ['admin', 'manager', 'clerk'].includes(role)) {
    updates.push('role = ?'); params.push(role);
  }
  if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
  if (password) {
    updates.push('password = ?');
    params.push(bcrypt.hashSync(password, 10));
  }

  if (updates.length === 0) return error(res, 400, 'No fields to update.');
  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  logger.info({ userId: req.params.id, updatedBy: req.user.id }, 'User updated');
  return success(res, { message: 'User updated successfully.' });
});

// ── DELETE /api/users/:id — delete user ───────────────────
router.delete('/:id', (req, res) => {
  if (req.params.id === req.user.id) return error(res, 400, 'You cannot delete yourself.');
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('User');
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  logger.info({ userId: req.params.id, deletedBy: req.user.id }, 'User deleted');
  return success(res, { message: 'User deleted.' });
});

module.exports = router;
