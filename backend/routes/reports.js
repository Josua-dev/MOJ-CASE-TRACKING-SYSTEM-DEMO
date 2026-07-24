/**
 * PDF Reports route — case summaries, session rosters, case register
 */
const { Router } = require('express');
const PDFDocument = require('pdfkit');
const { db } = require('../db/database');
const auth = require('../middleware/auth');
const { error } = require('../src/response');

const router = Router();
router.use(auth);

// ── Helper: add footer to every page ──────────────────────
function addFooter(doc, pageText) {
  doc.fontSize(7).fillColor('#94a3b8')
     .text(`MOJ Case Tracking System — ${pageText}`, 50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });
}

// ── Helper: draw table row ────────────────────────────────
function drawTableRow(doc, x, y, cols, widths, isHeader) {
  const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';
  const size = isHeader ? 8 : 7.5;
  doc.font(font).fontSize(size);
  let cx = x;
  cols.forEach((col, i) => {
    doc.text(col, cx + 4, y + 4, { width: widths[i] - 8, lineBreak: false });
    cx += widths[i];
  });
}

// ── GET /case/:id — Case Summary PDF ──────────────────────
router.get('/case/:id', (req, res) => {
  const c = db.prepare(`
    SELECT c.*, u.name AS created_by_name
    FROM cases c LEFT JOIN users u ON u.id = c.created_by
    WHERE c.id = ?
  `).get(req.params.id);
  if (!c) return error(res, 404, 'Case not found.');

  const logs = db.prepare(`
    SELECT cl.*, u.name AS user_name
    FROM case_logs cl LEFT JOIN users u ON u.id = cl.user_id
    WHERE cl.case_id = ?
    ORDER BY cl.performed_at ASC
  `).all(req.params.id);

  const docs = db.prepare('SELECT original_name, mime_type, size, created_at FROM documents WHERE case_id = ? ORDER BY created_at ASC').all(req.params.id);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="case-${c.case_number}-summary.pdf"`);
  doc.pipe(res);

  // ── Title ──
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f1f3d').text(c.case_number, 50, 50);
  doc.fontSize(14).fillColor('#475569').text(c.title, 50, 76);
  doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e2e5eb').stroke();

  // ── Info block ──
  const infoY = 115;
  const leftX = 50, rightX = 300;
  const infoData = [
    ['Type', c.case_type, 'Status', c.status],
    ['Priority', c.priority, 'Hearing Date', c.hearing_date || '—'],
    ['Plaintiff', c.plaintiff, 'Defendant', c.defendant],
    ['Presiding Officer', c.presiding_officer || '—', 'Court', c.court || '—'],
    ['Created', c.created_at, 'Updated', c.updated_at],
    ['Created By', c.created_by_name || '—', '', ''],
  ];

  doc.fontSize(9);
  infoData.forEach((row, i) => {
    const y = infoY + i * 20;
    doc.font('Helvetica-Bold').fillColor('#0f1724');
    doc.text(row[0], leftX, y);
    doc.font('Helvetica').fillColor('#475569');
    doc.text(row[1], leftX + 70, y, { width: 170 });

    if (row[2]) {
      doc.font('Helvetica-Bold').fillColor('#0f1724');
      doc.text(row[2], rightX, y);
      doc.font('Helvetica').fillColor('#475569');
      doc.text(row[3], rightX + 80, y, { width: 170 });
    }
  });

  // ── Description ──
  if (c.description) {
    const descY = infoY + infoData.length * 20 + 10;
    doc.moveTo(50, descY).lineTo(545, descY).strokeColor('#e2e5eb').stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f1724').text('Description', 50, descY + 10);
    doc.font('Helvetica').fontSize(9).fillColor('#475569').text(c.description, 50, descY + 28, { width: 495 });
  }

  // ── Documents table ──
  if (docs.length > 0) {
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f1f3d').text('Attached Documents', 50, 50);
    doc.moveTo(50, 68).lineTo(545, 68).strokeColor('#e2e5eb').stroke();

    const tY = 78;
    const cols = ['Name', 'Type', 'Size', 'Uploaded'];
    const widths = [200, 80, 80, 130];
    let cx = 50;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f1724');
    cols.forEach((col, i) => { doc.text(col, cx + 4, tY + 4, { width: widths[i] - 8 }); cx += widths[i]; });
    doc.moveTo(50, tY + 20).lineTo(545, tY + 20).strokeColor('#e2e5eb').stroke();

    docs.forEach((d, i) => {
      const rY = tY + 26 + i * 18;
      const sizeStr = d.size < 1024 ? `${d.size} B` : d.size < 1048576 ? `${(d.size / 1024).toFixed(1)} KB` : `${(d.size / 1048576).toFixed(1)} MB`;
      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text(d.original_name, 54, rY, { width: 196 });
      doc.text(d.mime_type, 254, rY, { width: 76 });
      doc.text(sizeStr, 334, rY, { width: 76 });
      doc.text(d.created_at || '', 414, rY, { width: 126 });
    });
  }

  // ── Audit log ──
  if (logs.length > 0) {
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f1f3d').text('Audit Log', 50, 50);
    doc.moveTo(50, 68).lineTo(545, 68).strokeColor('#e2e5eb').stroke();

    const tY = 78;
    const lCols = ['Action', 'Note', 'User', 'Date'];
    const lWidths = [80, 180, 100, 100];
    let lx = 50;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f1724');
    lCols.forEach((col, i) => { doc.text(col, lx + 4, tY + 4, { width: lWidths[i] - 8 }); lx += lWidths[i]; });
    doc.moveTo(50, tY + 20).lineTo(545, tY + 20).strokeColor('#e2e5eb').stroke();

    logs.forEach((log, i) => {
      const rY = tY + 26 + i * 18;
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
      doc.text(log.action, 54, rY, { width: 76 });
      doc.text(log.note || '—', 134, rY, { width: 176 });
      doc.text(log.user_name || 'System', 314, rY, { width: 96 });
      doc.text(log.performed_at || '', 414, rY, { width: 96 });
    });
  }

  addFooter(doc, `Case Summary — ${c.case_number}`);
  doc.end();
});

// ── GET /sessions — Session Roster PDF ────────────────────
router.get('/sessions', (req, res) => {
  const { from, to, courtroom_id } = req.query;
  if (!from || !to) return error(res, 400, 'from and to dates required.');

  const where = ['cs.session_date >= ?', 'cs.session_date <= ?'];
  const params = [from, to];
  if (courtroom_id) { where.push('cs.courtroom_id = ?'); params.push(courtroom_id); }

  const rows = db.prepare(`
    SELECT cs.*, c.case_number, c.title AS case_title, cr.name AS courtroom_name
    FROM court_sessions cs
    LEFT JOIN cases c ON c.id = cs.case_id
    LEFT JOIN courtrooms cr ON cr.id = cs.courtroom_id
    WHERE ${where.join(' AND ')}
    ORDER BY cs.session_date ASC, cs.start_time ASC
  `).all(...params);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="session-roster-${from}-to-${to}.pdf"`);
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f1f3d').text('Court Session Roster', 50, 50);
  doc.fontSize(11).fillColor('#475569').text(`${from} — ${to}${courtroom_id ? ' (filtered by courtroom)' : ''}`, 50, 76);
  doc.moveTo(50, 98).lineTo(545, 98).strokeColor('#e2e5eb').stroke();

  if (rows.length === 0) {
    doc.fontSize(11).fillColor('#94a3b8').text('No sessions found for this period.', 50, 120);
  } else {
    const cols = ['Date', 'Time', 'Type', 'Case', 'Courtroom', 'Magistrate', 'Status'];
    const widths = [70, 60, 60, 100, 70, 80, 60];
    let y = 115;

    // Header
    let cx = 50;
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f1724');
    cols.forEach((col, i) => { doc.text(col, cx + 2, y + 2, { width: widths[i] - 4 }); cx += widths[i]; });
    y += 16;

    rows.forEach((r, i) => {
      const rowY = y + i * 16;
      if (rowY > doc.page.height - 50) {
        doc.addPage();
        y = 50;
        cx = 50;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f1724');
        cols.forEach((col, i) => { doc.text(col, cx + 2, y + 2, { width: widths[i] - 4 }); cx += widths[i]; });
        y += 16;
      }
      cx = 50;
      doc.font('Helvetica').fontSize(7).fillColor('#475569');
      const vals = [r.session_date, r.start_time, r.session_type, r.case_number || '', r.courtroom_name || '', r.magistrate || '', r.status];
      vals.forEach((v, i) => { doc.text(v, cx + 2, rowY, { width: widths[i] - 4 }); cx += widths[i]; });
    });
  }

  addFooter(doc, 'Session Roster');
  doc.end();
});

// ── GET /cases — Case Register PDF ────────────────────────
router.get('/cases', (req, res) => {
  const { type, status, from, to } = req.query;
  const conditions = [];
  const params = [];
  if (type) { conditions.push('case_type = ?'); params.push(type); }
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (from) { conditions.push('created_at >= ?'); params.push(from); }
  if (to) { conditions.push('created_at <= ?'); params.push(to); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT case_number, title, case_type, status, priority, plaintiff, defendant, presiding_officer, created_at
    FROM cases ${where}
    ORDER BY created_at DESC
  `).all(...params);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="case-register-${new Date().toISOString().slice(0, 10)}.pdf"`);
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f1f3d').text('Case Register', 50, 50);
  doc.fontSize(11).fillColor('#475569').text(`Total: ${rows.length} case${rows.length !== 1 ? 's' : ''}`, 50, 76);
  doc.moveTo(50, 98).lineTo(545, 98).strokeColor('#e2e5eb').stroke();

  if (rows.length === 0) {
    doc.fontSize(11).fillColor('#94a3b8').text('No cases match the selected filters.', 50, 120);
  } else {
    const cols = ['Case #', 'Title', 'Type', 'Status', 'Priority', 'Filed'];
    const widths = [80, 140, 60, 60, 50, 70];
    let y = 115;

    let cx = 50;
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f1724');
    cols.forEach((col, i) => { doc.text(col, cx + 2, y + 2, { width: widths[i] - 4 }); cx += widths[i]; });
    y += 16;

    rows.forEach((r, i) => {
      const rowY = y + i * 16;
      if (rowY > doc.page.height - 50) {
        doc.addPage();
        y = 50;
        cx = 50;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f1724');
        cols.forEach((col, i) => { doc.text(col, cx + 2, y + 2, { width: widths[i] - 4 }); cx += widths[i]; });
        y += 16;
      }
      cx = 50;
      doc.font('Helvetica').fontSize(7).fillColor('#475569');
      const vals = [r.case_number, r.title, r.case_type, r.status, r.priority, r.created_at?.slice(0, 10) || ''];
      vals.forEach((v, i) => { doc.text(v, cx + 2, rowY, { width: widths[i] - 4 }); cx += widths[i]; });
    });
  }

  addFooter(doc, 'Case Register');
  doc.end();
});

module.exports = router;
