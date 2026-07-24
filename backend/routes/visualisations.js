/**
 * Visualisations routes — CRUD, data fetching, playlists
 *
 * Public read endpoints: list, get single, get data, stats-data (require auth)
 * Admin-only mutations: create, update, delete, duplicate, reorder, playlists
 */
const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');

const { db } = require('../db/database');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const logger = require('../src/logger');
const { success, error } = require('../src/response');
const { NotFoundError } = require('../src/errors');
const { validate, createVisSchema, updateVisSchema, createPlaylistSchema } = require('../src/validation');

const router = Router();

// All routes require authentication
router.use(auth);

// ── Data source query handlers ────────────────────────────────
const DATA_HANDLERS = {
  'cases/byType': () =>
    db.prepare("SELECT case_type AS name, COUNT(*) AS value FROM cases GROUP BY case_type").all(),
  'cases/byMonth': () =>
    db.prepare("SELECT strftime('%Y-%m', created_at) AS name, COUNT(*) AS value FROM cases GROUP BY name ORDER BY name").all(),
  'cases/byPriority': () =>
    db.prepare("SELECT priority AS name, COUNT(*) AS value FROM cases GROUP BY priority").all(),
  'cases/byStatus': () =>
    db.prepare("SELECT status AS name, COUNT(*) AS value FROM cases GROUP BY status").all(),
  'cases/byMagistrate': () =>
    db.prepare("SELECT presiding_officer AS name, COUNT(*) AS value FROM cases WHERE presiding_officer != '' GROUP BY name ORDER BY value DESC").all(),
  'users/activity': () =>
    db.prepare("SELECT date(performed_at) AS name, COUNT(*) AS value FROM case_logs GROUP BY name ORDER BY name LIMIT 30").all(),
  'cases/total': () => {
    const row = db.prepare("SELECT COUNT(*) AS c FROM cases").get();
    return [{ name: 'Total Cases', value: row.c }];
  },
};

// ── GET /api/visualisations — list with search, filter, pagination ──
router.get('/', (req, res) => {
  const { search, category, enabled, page = '1', limit = '50' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ? OR tags LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (enabled !== undefined) {
    conditions.push('enabled = ?');
    params.push(enabled === 'true' || enabled === '1' ? 1 : 0);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const countRow = db.prepare(`SELECT COUNT(*) AS total FROM visualisations ${where}`).get(...params);
  const rows = db.prepare(`SELECT * FROM visualisations ${where} ORDER BY display_order ASC, created_at DESC LIMIT ? OFFSET ?`).all(...params, limitNum, offset);

  // Parse JSON config for each row
  const data = rows.map(r => ({ ...r, config: JSON.parse(r.config || '{}') }));

  return success(res, data, {
    page: pageNum,
    limit: limitNum,
    total: countRow.total,
    totalPages: Math.ceil(countRow.total / limitNum),
  });
});

// ── GET /api/visualisations/stats-data — all aggregated data ────
router.get('/stats-data', (req, res) => {
  const results = {};
  for (const [key, handler] of Object.entries(DATA_HANDLERS)) {
    try { results[key] = handler(); } catch (e) { results[key] = []; }
  }
  return success(res, results);
});

// ── GET /api/visualisations/:id — single visualisation ─────────
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM visualisations WHERE id = ?').get(req.params.id);
  if (!row) throw new NotFoundError('Visualisation');

  const filters = db.prepare(
    'SELECT * FROM visualisation_filters WHERE visualisation_id = ? ORDER BY rowid'
  ).all(req.params.id);

  return success(res, { ...row, config: JSON.parse(row.config || '{}'), filters });
});

// ── GET /api/visualisations/:id/data — fetch chart data ────────
router.get('/:id/data', (req, res) => {
  const row = db.prepare('SELECT * FROM visualisations WHERE id = ? AND enabled = 1').get(req.params.id);
  if (!row) throw new NotFoundError('Visualisation');

  const handler = DATA_HANDLERS[row.data_source];
  if (!handler) return error(res, 400, `Unknown data source: ${row.data_source}`);

  // Record view
  try {
    db.prepare('INSERT INTO vis_views (id, visualisation_id, viewed_by) VALUES (?, ?, ?)')
      .run(uuidv4(), req.params.id, req.user?.id || null);
  } catch (_) { /* non-critical */ }

  try {
    const data = handler();
    return success(res, { data, source: row.data_source, chart_type: row.chart_type });
  } catch (e) {
    logger.error({ err: e, visualisationId: req.params.id }, 'Failed to fetch visualisation data');
    return error(res, 500, 'Failed to fetch data.');
  }
});

// ── POST /api/visualisations — create (admin) ─────────────────
router.post('/', admin, validate(createVisSchema), (req, res) => {
  const {
    name, description, chart_type, data_source, config,
    colour_theme, chart_size, animation_enabled, auto_refresh,
    refresh_interval, category, tags,
  } = req.body;

  const id = uuidv4();
  // Get next display_order
  const maxOrder = db.prepare('SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM visualisations').get().next;

  db.prepare(`
    INSERT INTO visualisations (id, name, description, chart_type, data_source, config,
      colour_theme, chart_size, animation_enabled, auto_refresh, refresh_interval,
      display_order, category, tags, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description || '', chart_type || 'bar', data_source || 'cases/byType',
    JSON.stringify(config || {}), colour_theme || 'default', chart_size || 'medium',
    animation_enabled !== undefined ? (animation_enabled ? 1 : 0) : 1,
    auto_refresh ? 1 : 0, refresh_interval || 0,
    maxOrder, category || '', tags || '', req.user.id);

  logger.info({ visualisationId: id, userId: req.user.id }, 'Visualisation created');
  return success(res, { id }, {}, 201);
});

// ── PUT /api/visualisations/reorder — batch reorder (admin) ────
router.put('/reorder', admin, (req, res) => {
  const { items } = req.body; // [{ id, display_order }]
  if (!Array.isArray(items) || items.length === 0) {
    return error(res, 400, 'Items array is required.');
  }

  const stmt = db.prepare('UPDATE visualisations SET display_order = ? WHERE id = ?');
  const updateOrder = db.transaction((list) => {
    for (const item of list) {
      stmt.run(item.display_order, item.id);
    }
  });

  try {
    updateOrder(items);
    return success(res, { message: 'Order updated.' });
  } catch (e) {
    return error(res, 400, 'Failed to update order.');
  }
});

// ── PUT /api/visualisations/:id — update (admin) ──────────────
router.put('/:id', admin, validate(updateVisSchema), (req, res) => {
  const existing = db.prepare('SELECT * FROM visualisations WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('Visualisation');

  const allowed = [
    'name', 'description', 'chart_type', 'data_source', 'config',
    'colour_theme', 'chart_size', 'animation_enabled', 'auto_refresh',
    'refresh_interval', 'fullscreen_support', 'enabled',
    'is_favourite', 'category', 'tags',
  ];
  const updates = [];
  const params = [];

  for (const f of allowed) {
    if (req.body[f] !== undefined) {
      let val = req.body[f];
      if (f === 'config') val = JSON.stringify(val);
      if (f === 'animation_enabled' || f === 'auto_refresh' || f === 'fullscreen_support' || f === 'enabled' || f === 'is_favourite') {
        val = val ? 1 : 0;
      }
      updates.push(`${f} = ?`);
      params.push(val);
    }
  }

  if (updates.length === 0) return error(res, 400, 'No fields to update.');

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE visualisations SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  // Handle filter updates
  if (req.body.filters && Array.isArray(req.body.filters)) {
    db.prepare('DELETE FROM visualisation_filters WHERE visualisation_id = ?').run(req.params.id);
    const insFilter = db.prepare(
      'INSERT INTO visualisation_filters (id, visualisation_id, filter_type, filter_value, enabled) VALUES (?, ?, ?, ?, ?)'
    );
    for (const f of req.body.filters) {
      if (f.filter_type && f.filter_value) {
        insFilter.run(uuidv4(), req.params.id, f.filter_type, f.filter_value, f.enabled !== undefined ? (f.enabled ? 1 : 0) : 1);
      }
    }
  }

  logger.info({ visualisationId: req.params.id, userId: req.user.id }, 'Visualisation updated');
  return success(res, { message: 'Visualisation updated successfully.' });
});

// ── POST /api/visualisations/:id/duplicate — clone (admin) ────
router.post('/:id/duplicate', admin, (req, res) => {
  const existing = db.prepare('SELECT * FROM visualisations WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('Visualisation');

  const newId = uuidv4();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM visualisations').get().next;

  db.prepare(`
    INSERT INTO visualisations (id, name, description, chart_type, data_source, config,
      colour_theme, chart_size, animation_enabled, auto_refresh, refresh_interval,
      fullscreen_support, display_order, enabled, category, tags, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId, existing.name + ' (Copy)', existing.description, existing.chart_type,
    existing.data_source, existing.config, existing.colour_theme,
    existing.chart_size, existing.animation_enabled, existing.auto_refresh,
    existing.refresh_interval, existing.fullscreen_support, maxOrder, 1,
    existing.category, existing.tags, req.user.id
  );

  logger.info({ originalId: req.params.id, newId, userId: req.user.id }, 'Visualisation duplicated');
  return success(res, { id: newId }, {}, 201);
});

// ── DELETE /api/visualisations/:id — delete (admin) ───────────
router.delete('/:id', admin, (req, res) => {
  const existing = db.prepare('SELECT id FROM visualisations WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('Visualisation');

  db.prepare('DELETE FROM visualisations WHERE id = ?').run(req.params.id);
  logger.info({ visualisationId: req.params.id, userId: req.user.id }, 'Visualisation deleted');
  return success(res, { message: 'Visualisation deleted.' });
});

// ── PLAYLIST ENDPOINTS (mounted at /api/playlists in server.js) ─
// These are exported as playlistRouter so server.js can mount them at /api/playlists
const playlistRouter = Router();
playlistRouter.use(auth);

playlistRouter.get('/', (req, res) => {
  const { page = '1', limit = '50' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const countRow = db.prepare('SELECT COUNT(*) AS total FROM playlists').get();
  const rows = db.prepare('SELECT * FROM playlists ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limitNum, offset);

  // Fetch items for each playlist
  const data = rows.map(p => {
    const items = db.prepare(`
      SELECT pi.*, v.name AS visualisation_name, v.chart_type, v.data_source
      FROM playlist_items pi
      LEFT JOIN visualisations v ON v.id = pi.visualisation_id
      WHERE pi.playlist_id = ?
      ORDER BY pi.display_order ASC
    `).all(p.id);
    return { ...p, items };
  });

  return success(res, data, {
    page: pageNum,
    limit: limitNum,
    total: countRow.total,
    totalPages: Math.ceil(countRow.total / limitNum),
  });
});

playlistRouter.post('/', admin, validate(createPlaylistSchema), (req, res) => {
  const id = uuidv4();
  db.prepare('INSERT INTO playlists (id, name, description, created_by) VALUES (?, ?, ?, ?)')
    .run(id, req.body.name, req.body.description || '', req.user.id);

  // Add items if provided
  if (req.body.items && Array.isArray(req.body.items)) {
    const insItem = db.prepare(
      'INSERT INTO playlist_items (id, playlist_id, visualisation_id, display_order, duration_seconds) VALUES (?, ?, ?, ?, ?)'
    );
    for (let i = 0; i < req.body.items.length; i++) {
      const item = req.body.items[i];
      insItem.run(uuidv4(), id, item.visualisation_id, i, item.duration_seconds || 30);
    }
  }

  logger.info({ playlistId: id, userId: req.user.id }, 'Playlist created');
  return success(res, { id }, {}, 201);
});

playlistRouter.put('/:id', admin, (req, res) => {
  const existing = db.prepare('SELECT id FROM playlists WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('Playlist');

  const updates = [];
  const params = [];
  if (req.body.name !== undefined) { updates.push('name = ?'); params.push(req.body.name); }
  if (req.body.description !== undefined) { updates.push('description = ?'); params.push(req.body.description); }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE playlists SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  // Update items if provided (full replacement)
  if (req.body.items && Array.isArray(req.body.items)) {
    db.prepare('DELETE FROM playlist_items WHERE playlist_id = ?').run(req.params.id);
    const insItem = db.prepare(
      'INSERT INTO playlist_items (id, playlist_id, visualisation_id, display_order, duration_seconds) VALUES (?, ?, ?, ?, ?)'
    );
    for (let i = 0; i < req.body.items.length; i++) {
      const item = req.body.items[i];
      insItem.run(uuidv4(), req.params.id, item.visualisation_id, i, item.duration_seconds || 30);
    }
  }

  logger.info({ playlistId: req.params.id, userId: req.user.id }, 'Playlist updated');
  return success(res, { message: 'Playlist updated.' });
});

playlistRouter.delete('/:id', admin, (req, res) => {
  const existing = db.prepare('SELECT id FROM playlists WHERE id = ?').get(req.params.id);
  if (!existing) throw new NotFoundError('Playlist');

  db.prepare('DELETE FROM playlists WHERE id = ?').run(req.params.id);
  logger.info({ playlistId: req.params.id, userId: req.user.id }, 'Playlist deleted');
  return success(res, { message: 'Playlist deleted.' });
});

module.exports = { visRouter: router, playlistRouter };
