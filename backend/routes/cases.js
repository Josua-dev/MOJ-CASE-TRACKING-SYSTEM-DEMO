const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const auth = require('../middleware/auth');

// Get all cases with optional search/filter
router.get('/', auth, (req, res) => {
  const { search, status, type, priority } = req.query;
  let query = 'SELECT * FROM cases WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (case_number LIKE ? OR title LIKE ? OR plaintiff LIKE ? OR defendant LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (type) { query += ' AND case_type = ?'; params.push(type); }
  if (priority) { query += ' AND priority = ?'; params.push(priority); }

  query += ' ORDER BY created_at DESC';
  const cases = db.prepare(query).all(...params);
  res.json(cases);
});

// Get single case + logs
router.get('/:id', auth, (req, res) => {
  const c = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  const logs = db.prepare('SELECT cl.*, u.name as user_name FROM case_logs cl JOIN users u ON cl.performed_by = u.id WHERE cl.case_id = ? ORDER BY cl.performed_at DESC').all(req.params.id);
  res.json({ ...c, logs });
});

// Create case
router.post('/', auth, (req, res) => {
  const { title, description, case_type, status, priority, plaintiff, defendant, presiding_officer, hearing_date, next_action } = req.body;
  if (!title || !case_type || !plaintiff || !defendant) return res.status(400).json({ error: 'Required fields missing' });

  const id = uuidv4();
  const year = new Date().getFullYear();
  const count = db.prepare('SELECT COUNT(*) as c FROM cases').get().c + 1;
  const case_number = `MOJ-${year}-${String(count).padStart(4, '0')}`;

  db.prepare(`INSERT INTO cases (id, case_number, title, description, case_type, status, priority, plaintiff, defendant, presiding_officer, hearing_date, next_action, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, case_number, title, description, case_type, status || 'Open', priority || 'Medium', plaintiff, defendant, presiding_officer, hearing_date, next_action, req.user.id);

  db.prepare('INSERT INTO case_logs (id, case_id, action, note, performed_by) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), id, 'Case Created', `Case ${case_number} opened`, req.user.id);

  res.status(201).json({ id, case_number });
});

// Update case
router.put('/:id', auth, (req, res) => {
  const existing = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { title, description, case_type, status, priority, plaintiff, defendant, presiding_officer, hearing_date, next_action } = req.body;
  db.prepare(`UPDATE cases SET title=?, description=?, case_type=?, status=?, priority=?, plaintiff=?, defendant=?, presiding_officer=?, hearing_date=?, next_action=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(title, description, case_type, status, priority, plaintiff, defendant, presiding_officer, hearing_date, next_action, req.params.id);

  if (existing.status !== status) {
    db.prepare('INSERT INTO case_logs (id, case_id, action, note, performed_by) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, 'Status Updated', `Status changed from "${existing.status}" to "${status}"`, req.user.id);
  } else {
    db.prepare('INSERT INTO case_logs (id, case_id, action, note, performed_by) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, 'Case Updated', 'Case details modified', req.user.id);
  }

  res.json({ message: 'Updated' });
});

// Add log note
router.post('/:id/logs', auth, (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'Note required' });
  db.prepare('INSERT INTO case_logs (id, case_id, action, note, performed_by) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, 'Note Added', note, req.user.id);
  res.status(201).json({ message: 'Log added' });
});

// Dashboard stats
router.get('/meta/stats', auth, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM cases').get().c;
  const open = db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'Open'").get().c;
  const active = db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'Active'").get().c;
  const closed = db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'Closed'").get().c;
  const pending = db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'Pending'").get().c;
  const high = db.prepare("SELECT COUNT(*) as c FROM cases WHERE priority = 'High'").get().c;
  const byType = db.prepare("SELECT case_type, COUNT(*) as count FROM cases GROUP BY case_type").all();
  const recent = db.prepare("SELECT * FROM cases ORDER BY created_at DESC LIMIT 5").all();
  res.json({ total, open, active, closed, pending, high, byType, recent });
});

module.exports = router;
