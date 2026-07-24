/**
 * Cases routes — CRUD, search, stats, audit log, CSV export
 */
const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');

const { db, getNextCaseNumber } = require('../db/database');
const auth = require('../middleware/auth');
const logger = require('../src/logger');
const { success, error } = require('../src/response');
const { NotFoundError } = require('../src/errors');
const { createNotification } = require('../src/notify');
const {
  validate,
  createCaseSchema,
  updateCaseSchema,
  noteSchema,
} = require('../src/validation');

const router = Router();

// All case routes require authentication
router.use(auth);

// ── GET / — list/search cases with pagination ──────────────
router.get('/', (req, res) => {
  const { search, status, type, priority, sort_by, sort_order, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  // Whitelist sort columns to prevent SQL injection
  const SORT_WHITELIST = ['created_at', 'updated_at', 'case_number', 'title', 'status', 'priority', 'hearing_date'];
  const sortCol = SORT_WHITELIST.includes(sort_by) ? sort_by : 'created_at';
  const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(c.case_number LIKE ? OR c.title LIKE ? OR c.plaintiff LIKE ? OR c.defendant LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }
  if (type) {
    conditions.push('c.case_type = ?');
    params.push(type);
  }
  if (priority) {
    conditions.push('c.priority = ?');
    params.push(priority);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  // Total count (for pagination meta)
  const countRow = db.prepare(`SELECT COUNT(*) AS total FROM cases c ${where}`).get(...params);
  const total = countRow.total;

  // Paginated results
  const rows = db
    .prepare(`SELECT * FROM cases c ${where} ORDER BY c.${sortCol} ${sortDir} LIMIT ? OFFSET ?`)
    .all(...params, limitNum, offset);

  return success(res, rows, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

// ── GET /export/csv — CSV export ────────────────────────────
router.get('/export/csv', (req, res) => {
  const rows = db.prepare(
    'SELECT case_number, title, case_type, status, priority, plaintiff, defendant, presiding_officer, hearing_date, created_at, updated_at FROM cases ORDER BY created_at DESC'
  ).all();

  const headers = ['Case Number', 'Title', 'Type', 'Status', 'Priority', 'Plaintiff', 'Defendant', 'Presiding Officer', 'Hearing Date', 'Created', 'Updated'];
  const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map(r => [r.case_number, r.title, r.case_type, r.status, r.priority, r.plaintiff, r.defendant, r.presiding_officer, r.hearing_date, r.created_at, r.updated_at].map(esc).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="moj-cases.csv"');
  res.send(csv);
});

// ── GET /meta/stats — dashboard aggregates ─────────────────
router.get('/meta/stats', (req, res) => {
  const { from, to } = req.query;
  let dateFilter = '';
  const params = [];

  if (from) { dateFilter += ' AND created_at >= ?'; params.push(from); }
  if (to) { dateFilter += ' AND created_at <= ?'; params.push(to); }

  const total = db.prepare(`SELECT COUNT(*) AS c FROM cases WHERE 1=1 ${dateFilter}`).get(...params).c;
  const open = db.prepare(`SELECT COUNT(*) AS c FROM cases WHERE status = 'Open' ${dateFilter}`).get(...params).c;
  const active = db.prepare(`SELECT COUNT(*) AS c FROM cases WHERE status = 'Active' ${dateFilter}`).get(...params).c;
  const closed = db.prepare(`SELECT COUNT(*) AS c FROM cases WHERE status = 'Closed' ${dateFilter}`).get(...params).c;
  const pending = db.prepare(`SELECT COUNT(*) AS c FROM cases WHERE status = 'Pending' ${dateFilter}`).get(...params).c;
  const high = db.prepare(`SELECT COUNT(*) AS c FROM cases WHERE priority = 'High' ${dateFilter}`).get(...params).c;

  const byType = db.prepare(
    `SELECT case_type AS type, COUNT(*) AS count FROM cases WHERE 1=1 ${dateFilter} GROUP BY case_type`
  ).all(...params);

  const recent = db.prepare(
    'SELECT * FROM cases ORDER BY created_at DESC LIMIT 5'
  ).all();

  const byMonth = db.prepare(
    `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
     FROM cases WHERE created_at IS NOT NULL ${dateFilter}
     GROUP BY strftime('%Y-%m', created_at)
     ORDER BY month ASC`
  ).all(...params);

  const byPriority = db.prepare(
    `SELECT priority, COUNT(*) AS count FROM cases WHERE 1=1 ${dateFilter} GROUP BY priority`
  ).all(...params);

  return success(res, { total, open, active, closed, pending, high, byType, byMonth, byPriority, recent });
});

// ── GET /:id — single case with audit trail ────────────────
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!row) throw new NotFoundError('Case');

  const logs = db
    .prepare(
      `SELECT l.*, u.name AS user_name
       FROM case_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.case_id = ?
       ORDER BY l.performed_at DESC`
    )
    .all(req.params.id);

  return success(res, { ...row, logs });
});

// ── POST / — create case ────────────────────────────────────
router.post('/', validate(createCaseSchema), (req, res) => {
  const {
    title, case_type, status, priority,
    plaintiff, defendant, presiding_officer,
    hearing_date, next_action, description,
  } = req.body;

  const id = uuidv4();
  const caseNumber = getNextCaseNumber();

  db.prepare(`
    INSERT INTO cases (id, case_number, title, case_type, status, priority, plaintiff, defendant, presiding_officer, hearing_date, next_action, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, caseNumber, title, case_type, status, priority, plaintiff, defendant, presiding_officer || '', hearing_date || '', next_action || '', description || '', req.user.id);

  db.prepare(
    'INSERT INTO case_logs (id, case_id, user_id, action) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), id, req.user.id, 'Case Created');

  logger.info({ caseId: id, caseNumber, userId: req.user.id }, 'Case created');

  createNotification('broadcast:all', 'info', 'New Case Created', `${caseNumber} — ${title}`);

  return success(res, { id, case_number: caseNumber }, {}, 201);
});

// ── PUT /:id — update case ──────────────────────────────────
router.put('/:id', validate(updateCaseSchema), (req, res) => {
  const existing = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('Case');

  const fields = ['title', 'case_type', 'status', 'priority', 'plaintiff', 'defendant', 'presiding_officer', 'hearing_date', 'next_action', 'description'];
  const updates = [];
  const params = [];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }

  if (updates.length === 0) return error(res, 400, 'No fields to update.');

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE cases SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const statusChanged = req.body.status && req.body.status !== existing.status;
  if (statusChanged) {
    db.prepare(
      'INSERT INTO case_logs (id, case_id, user_id, action, note) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), req.params.id, req.user.id, 'Status Updated', `Changed from ${existing.status} to ${req.body.status}`);
    logger.info({ caseId: req.params.id, from: existing.status, to: req.body.status, userId: req.user.id }, 'Case status updated');
  } else {
    db.prepare(
      'INSERT INTO case_logs (id, case_id, user_id, action) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), req.params.id, req.user.id, 'Case Updated');
    logger.info({ caseId: req.params.id, userId: req.user.id }, 'Case updated');
  }

  return success(res, { message: 'Case updated successfully.' });
});

// ── POST /:id/logs — add note ───────────────────────────────
router.post('/:id/logs', validate(noteSchema), (req, res) => {
  const existing = db.prepare('SELECT id FROM cases WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('Case');

  db.prepare(
    'INSERT INTO case_logs (id, case_id, user_id, action, note) VALUES (?, ?, ?, ?, ?)'
  ).run(uuidv4(), req.params.id, req.user.id, 'Note Added', req.body.note);

  logger.info({ caseId: req.params.id, userId: req.user.id }, 'Note added to case');
  return success(res, { message: 'Note added.' }, {}, 201);
});

module.exports = router;
