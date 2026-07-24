/**
 * Notification routes — list, read, preferences
 */
const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const auth = require('../middleware/auth');
const logger = require('../src/logger');
const { success, error } = require('../src/response');

const router = Router();
router.use(auth);

// ── List notifications for current user ─────────────────
router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const unreadOnly = req.query.filter === 'unread';

  let where = 'WHERE user_id = ?';
  const params = [req.user.id];
  if (unreadOnly) { where += ' AND read = 0'; }

  const count = db.prepare(`SELECT COUNT(*) AS total FROM notifications ${where}`).get(...params);
  const rows = db.prepare(`
    SELECT * FROM notifications ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const unreadCount = db.prepare('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id);

  return success(res, rows, {
    page, limit, total: count.total,
    totalPages: Math.ceil(count.total / limit),
    unread: unreadCount.c,
  });
});

// ── Unread count (lightweight) ──────────────────────────
router.get('/unread-count', (req, res) => {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id);
  return success(res, { count: c });
});

// ── Mark single notification as read ────────────────────
router.put('/:id/read', (req, res) => {
  const n = db.prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!n) return error(res, 404, 'Notification not found.');
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  return success(res, { message: 'Marked as read.' });
});

// ── Mark all as read ────────────────────────────────────
router.put('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(req.user.id);
  return success(res, { message: 'All notifications marked as read.' });
});

// ── Preferences ─────────────────────────────────────────
router.get('/preferences', (req, res) => {
  let prefs = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(req.user.id);
  if (!prefs) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)
    `).run(id, req.user.id);
    prefs = { id, user_id: req.user.id, in_app: 1, email_alerts: 0, case_updates: 1, new_sessions: 1, document_uploads: 1, system_alerts: 1 };
  }
  return success(res, prefs);
});

router.put('/preferences', (req, res) => {
  const { in_app, email_alerts, case_updates, new_sessions, document_uploads, system_alerts } = req.body;
  let existing = db.prepare('SELECT id FROM notification_preferences WHERE user_id = ?').get(req.user.id);
  if (!existing) {
    const id = uuidv4();
    db.prepare('INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)').run(id, req.user.id);
    existing = { id };
  }
  const fields = [];
  const params = [];
  if (in_app !== undefined) { fields.push('in_app = ?'); params.push(in_app ? 1 : 0); }
  if (email_alerts !== undefined) { fields.push('email_alerts = ?'); params.push(email_alerts ? 1 : 0); }
  if (case_updates !== undefined) { fields.push('case_updates = ?'); params.push(case_updates ? 1 : 0); }
  if (new_sessions !== undefined) { fields.push('new_sessions = ?'); params.push(new_sessions ? 1 : 0); }
  if (document_uploads !== undefined) { fields.push('document_uploads = ?'); params.push(document_uploads ? 1 : 0); }
  if (system_alerts !== undefined) { fields.push('system_alerts = ?'); params.push(system_alerts ? 1 : 0); }
  if (fields.length) {
    params.push(req.user.id);
    db.prepare(`UPDATE notification_preferences SET ${fields.join(', ')} WHERE user_id = ?`).run(...params);
  }
  return success(res, { message: 'Preferences updated.' });
});

module.exports = router;
