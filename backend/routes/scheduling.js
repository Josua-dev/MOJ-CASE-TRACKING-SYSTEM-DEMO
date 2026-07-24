/**
 * Court scheduling routes — sessions & courtrooms
 */
const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');

const { db } = require('../db/database');
const auth = require('../middleware/auth');
const logger = require('../src/logger');
const { success, error } = require('../src/response');
const { NotFoundError } = require('../src/errors');
const { createNotification } = require('../src/notify');

const router = Router();
router.use(auth);

// ── COURTROOMS ──────────────────────────────────────────────

router.get('/courtrooms', (req, res) => {
  const rooms = db.prepare('SELECT * FROM courtrooms ORDER BY name ASC').all();
  return success(res, rooms);
});

router.post('/courtrooms', (req, res) => {
  const { name, location, capacity } = req.body;
  if (!name) return error(res, 400, 'Courtroom name is required.');
  const id = uuidv4();
  db.prepare('INSERT INTO courtrooms (id, name, location, capacity) VALUES (?, ?, ?, ?)')
    .run(id, name, location || '', capacity || 1);
  return success(res, { id }, {}, 201);
});

// ── SESSIONS ────────────────────────────────────────────────

router.get('/sessions', (req, res) => {
  const { date, courtroom_id, magistrate, page = '1', limit = '100' } = req.query;
  const conditions = [];
  const params = [];
  if (date) { conditions.push('cs.session_date = ?'); params.push(date); }
  if (courtroom_id) { conditions.push('cs.courtroom_id = ?'); params.push(courtroom_id); }
  if (magistrate) { conditions.push('cs.magistrate LIKE ?'); params.push(`%${magistrate}%`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
  const offset = (pageNum - 1) * limitNum;

  const countRow = db.prepare(`SELECT COUNT(*) AS total FROM court_sessions cs ${where}`).get(...params);
  const rows = db.prepare(`
    SELECT cs.*, c.case_number, c.title AS case_title, cr.name AS courtroom_name
    FROM court_sessions cs
    LEFT JOIN cases c ON c.id = cs.case_id
    LEFT JOIN courtrooms cr ON cr.id = cs.courtroom_id
    ${where}
    ORDER BY cs.session_date ASC, cs.start_time ASC
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);

  return success(res, rows, {
    page: pageNum, limit: limitNum, total: countRow.total,
    totalPages: Math.ceil(countRow.total / limitNum),
  });
});

router.get('/sessions/range', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return error(res, 400, 'from and to dates required.');
  const rows = db.prepare(`
    SELECT cs.*, c.case_number, c.title AS case_title, cr.name AS courtroom_name
    FROM court_sessions cs
    LEFT JOIN cases c ON c.id = cs.case_id
    LEFT JOIN courtrooms cr ON cr.id = cs.courtroom_id
    WHERE cs.session_date >= ? AND cs.session_date <= ?
    ORDER BY cs.session_date ASC, cs.start_time ASC
  `).all(from, to);
  return success(res, rows);
});

router.post('/sessions', (req, res) => {
  const { case_id, courtroom_id, magistrate, session_date, start_time, end_time, session_type, notes } = req.body;
  if (!case_id || !session_date || !start_time) return error(res, 400, 'Case, date, and start time required.');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO court_sessions (id, case_id, courtroom_id, magistrate, session_date, start_time, end_time, session_type, notes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)
  `).run(id, case_id, courtroom_id || null, magistrate || '', session_date, start_time, end_time || '', session_type || 'Hearing', notes || '', req.user.id);

  logger.info({ sessionId: id, caseId: case_id }, 'Court session created');

  createNotification('broadcast:all', 'info', 'Court Session Scheduled', `${session_type || 'Hearing'} on ${session_date} at ${start_time}`);

  return success(res, { id }, {}, 201);
});

router.put('/sessions/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM court_sessions WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('Session');

  const { case_id, courtroom_id, magistrate, session_date, start_time, end_time, session_type, notes, status } = req.body;
  const updates = []; const params = [];
  if (case_id !== undefined) { updates.push('case_id = ?'); params.push(case_id); }
  if (courtroom_id !== undefined) { updates.push('courtroom_id = ?'); params.push(courtroom_id); }
  if (magistrate !== undefined) { updates.push('magistrate = ?'); params.push(magistrate); }
  if (session_date !== undefined) { updates.push('session_date = ?'); params.push(session_date); }
  if (start_time !== undefined) { updates.push('start_time = ?'); params.push(start_time); }
  if (end_time !== undefined) { updates.push('end_time = ?'); params.push(end_time); }
  if (session_type !== undefined) { updates.push('session_type = ?'); params.push(session_type); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (!updates.length) return error(res, 400, 'No fields to update.');
  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);
  db.prepare(`UPDATE court_sessions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return success(res, { message: 'Session updated.' });
});

router.delete('/sessions/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM court_sessions WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('Session');
  db.prepare('DELETE FROM court_sessions WHERE id = ?').run(req.params.id);
  return success(res, { message: 'Session deleted.' });
});

module.exports = router;
