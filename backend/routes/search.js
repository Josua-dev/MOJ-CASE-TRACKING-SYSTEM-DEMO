/**
 * Global full-text search route — FTS5 across cases, documents, logs
 */
const { Router } = require('express');
const { db } = require('../db/database');
const auth = require('../middleware/auth');
const { success, error } = require('../src/response');

const router = Router();
router.use(auth);

// ── Search all FTS tables ──────────────────────────────────
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return success(res, { cases: [], documents: [], logs: [] });

  // Sanitise: escape double-quotes for FTS5, wrap in quotes for phrase search
  const sanitised = q.replace(/"/g, '').trim();
  const ftsQuery = sanitised.includes(' ')
    ? `"${sanitised}" OR ${sanitised.split(/\s+/).map(w => `"${w}"`).join(' OR ')}`
    : `"${sanitised}"*`;

  const limit = Math.min(25, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const offset = (page - 1) * limit;

  let ftsAvailable = true;
  try { db.prepare('SELECT 1 FROM cases_fts LIMIT 0').get(); }
  catch { ftsAvailable = false; }

  if (!ftsAvailable) {
    // Fallback: LIKE-based search
    const like = `%${sanitised}%`;
    const cases = db.prepare(`
      SELECT id, case_number, title, plaintiff, defendant, case_type, status, created_at
      FROM cases
      WHERE case_number LIKE ? OR title LIKE ? OR plaintiff LIKE ? OR defendant LIKE ? OR description LIKE ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(like, like, like, like, like, limit, offset);

    const docs = db.prepare(`
      SELECT d.id, d.original_name, d.mime_type, d.size, d.case_id, c.case_number
      FROM documents d LEFT JOIN cases c ON c.id = d.case_id
      WHERE d.original_name LIKE ?
      LIMIT ? OFFSET ?
    `).all(like, limit, offset);

    return success(res, { cases, documents: docs, logs: [], ftsMode: 'like' });
  }

  // ── FTS5 search ─────────────────────────────────────────
  try {
    const cases = db.prepare(`
      SELECT c.id, c.case_number, c.title, c.plaintiff, c.defendant, c.case_type, c.status, c.created_at,
             snippet(cases_fts, 0, '<mark>', '</mark>', '...', 32) AS case_number_hl,
             snippet(cases_fts, 1, '<mark>', '</mark>', '...', 48) AS title_hl,
             snippet(cases_fts, 4, '<mark>', '</mark>', '...', 32) AS defendant_hl
      FROM cases_fts
      JOIN cases c ON c.rowid = cases_fts.rowid
      WHERE cases_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `).all(ftsQuery, limit, offset);

    const documents = db.prepare(`
      SELECT d.id, d.original_name, d.mime_type, d.size, d.case_id, c.case_number,
             snippet(documents_fts, 0, '<mark>', '</mark>', '...', 32) AS name_hl
      FROM documents_fts
      JOIN documents d ON d.rowid = documents_fts.rowid
      LEFT JOIN cases c ON c.id = d.case_id
      WHERE documents_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `).all(ftsQuery, limit, offset);

    const logs = db.prepare(`
      SELECT cl.id, cl.action, cl.note, cl.case_id, cl.performed_at, c.case_number,
             snippet(case_logs_fts, 0, '<mark>', '</mark>', '...', 32) AS action_hl,
             snippet(case_logs_fts, 1, '<mark>', '</mark>', '...', 48) AS note_hl
      FROM case_logs_fts
      JOIN case_logs cl ON cl.rowid = case_logs_fts.rowid
      LEFT JOIN cases c ON c.id = cl.case_id
      WHERE case_logs_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `).all(ftsQuery, limit, offset);

    return success(res, { cases, documents, logs, ftsMode: 'fts5' });
  } catch (e) {
    return error(res, 400, 'Search query error. Try simpler terms.');
  }
});

module.exports = router;
