/**
 * Auth routes — login & register
 */
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const { db } = require('../db/database');
const config = require('../src/config');
const logger = require('../src/logger');
const { success, error } = require('../src/response');
const { validate, loginSchema, registerSchema } = require('../src/validation');
const { UnauthorizedError, ConflictError, ValidationError } = require('../src/errors');

const router = Router();

// ── Rate limiter ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, error: 'Too many login attempts. Please try again later.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ── POST /login ─────────────────────────────────────────────
router.post('/login', authLimiter, validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) throw new UnauthorizedError('Invalid credentials.');

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) throw new UnauthorizedError('Invalid credentials.');

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

  // Set httpOnly cookie (more secure than localStorage)
  res.cookie('moj_token', token, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: ONE_DAY_MS,
  });

  logger.info({ userId: user.id, role: user.role }, 'User logged in');
  return success(res, { token, user: payload });
});

// ── POST /register ──────────────────────────────────────────
router.post('/register', validate(registerSchema), (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new ConflictError('Email already registered.');

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  const userRole = role || 'clerk';

  db.prepare(
    'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, email, hashedPassword, userRole);

  logger.info({ userId: id, role: userRole }, 'User registered');
  return success(res, { message: 'User created successfully.' }, {}, 201);
});

// ── GET /me — verify token & return user ───────────────────────
router.get('/me', require('../middleware/auth'), (req, res) => {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return error(res, 401, 'User no longer exists.');
  return success(res, { user });
});

module.exports = router;
