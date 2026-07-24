/**
 * Document routes — upload, list, download, delete
 */
const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { db } = require('../db/database');
const auth = require('../middleware/auth');
const logger = require('../src/logger');
const { success, error } = require('../src/response');
const { NotFoundError } = require('../src/errors');
const { createNotification } = require('../src/notify');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error(`File type ${ext} not allowed.`));
    cb(null, true);
  },
});

const router = Router();

// ── GET /api/cases/:caseId/documents — list documents for a case ──
router.get('/cases/:caseId/documents', auth, (req, res) => {
  const docs = db.prepare(
    'SELECT d.*, u.name AS uploaded_by_name FROM documents d LEFT JOIN users u ON u.id = d.uploaded_by WHERE d.case_id = ? ORDER BY d.created_at DESC'
  ).all(req.params.caseId);
  return success(res, docs);
});

// ── POST /api/cases/:caseId/documents — upload document ──────────
router.post('/cases/:caseId/documents', auth, upload.single('file'), (req, res) => {
  if (!req.file) return error(res, 400, 'No file provided.');
  const { originalname, mimetype, size, filename } = req.file;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO documents (id, case_id, original_name, mime_type, size, storage_path, category, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.caseId, originalname, mimetype, size, filename, req.body?.category || '', req.user.id);

  logger.info({ documentId: id, caseId: req.params.caseId, name: originalname, userId: req.user.id }, 'Document uploaded');

  const caseInfo = db.prepare('SELECT case_number FROM cases WHERE id = ?').get(req.params.caseId);
  createNotification('broadcast:all', 'info', 'Document Uploaded', `${originalname} — Case ${caseInfo?.case_number || ''}`);

  return success(res, { id, original_name: originalname, mime_type: mimetype, size }, {}, 201);
});

// ── GET /api/documents/:id/download — download document ─────────
router.get('/documents/:id/download', auth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) throw new NotFoundError('Document');

  const filePath = path.join(UPLOAD_DIR, doc.storage_path);
  if (!fs.existsSync(filePath)) return error(res, 404, 'File not found on disk.');

  res.setHeader('Content-Type', doc.mime_type);
  res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name}"`);
  res.sendFile(filePath);
});

// ── DELETE /api/documents/:id — delete document ──────────────────
router.delete('/documents/:id', auth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) throw new NotFoundError('Document');

  const filePath = path.join(UPLOAD_DIR, doc.storage_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  logger.info({ documentId: req.params.id, caseId: doc.case_id, userId: req.user.id }, 'Document deleted');
  return success(res, { message: 'Document deleted.' });
});

module.exports = router;
