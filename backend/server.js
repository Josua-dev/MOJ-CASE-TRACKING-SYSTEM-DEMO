/**
 * MOJ Case Tracking System — Backend Entry Point v1.2.0
 *
 * Features:
 *   - Security headers (Helmet)
 *   - CORS restricted to configured origins
 *   - Request ID tracing
 *   - Structured logging (Pino)
 *   - Compression
 *   - Rate limiting on auth routes
 *   - CSRF protection on mutating requests
 *   - Standardised JSON response envelope
 *   - Global error handler
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');

const config = require('./src/config');
const { success } = require('./src/response');
const logger = require('./src/logger');
const requestId = require('./src/request-id');
const { csrfTokenRoute, csrfProtection } = require('./src/csrf');

const app = express();

// ── Core middleware (order matters) ───────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : ['http://localhost:3000'])],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      manifestSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestId);

// ── Request logging middleware ────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({ req, res, duration }, `${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ── Trust proxy for rate limiting behind reverse proxies ─────
app.set('trust proxy', 1);

// ── Public routes ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  return success(res, {
    status: 'ok',
    system: 'MOJ Case Tracking System',
    version: '1.2.0',
    environment: config.env,
    requestId: req.id,
  });
});

app.get('/api/csrf-token', csrfTokenRoute);

// ── API routes with CSRF protection ──────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', csrfProtection, require('./routes/cases'));
app.use('/api/visualisations', csrfProtection, require('./routes/visualisations').visRouter);
app.use('/api/playlists', csrfProtection, require('./routes/visualisations').playlistRouter);
app.use('/api/users', csrfProtection, require('./routes/users'));
app.use('/api', csrfProtection, require('./routes/documents')); // document routes
app.use('/api/scheduling', csrfProtection, require('./routes/scheduling'));
app.use('/api/search', require('./routes/search')); // GET-only, auth via middleware
app.use('/api/notifications', csrfProtection, require('./routes/notifications'));
app.use('/api/reports', csrfProtection, require('./routes/reports'));

// ── Production: serve React build ─────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
}

// ── 404 catch-all / SPA fallback ──────────────────────────────
app.use((req, res) => {
  // In production, let React Router handle non-API routes (SPA)
  if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  }
  res.status(404).json({ success: false, error: 'Route not found.', code: 'NOT_FOUND' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const body = {
    success: false,
    error: err.expose || statusCode < 500 ? err.message : 'Internal server error.',
    code: err.code || 'INTERNAL_ERROR',
  };
  if (err.details) body.details = err.details;

  if (statusCode >= 500) {
    logger.error({ err, req }, err.message);
  } else {
    logger.warn({ err, req }, err.message);
  }

  res.status(statusCode).json(body);
});

// ── Start (only when run directly, not during tests) ──────────
if (process.env.NODE_ENV !== 'test') {
  // Seed 260+ realistic Namibian cases on fresh database (idempotent)
  try {
    require('./db/seed-cases');
  } catch (e) {
    logger.warn({ err: e.message }, 'Case seeding skipped (non-fatal)');
  }

  app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env },
      `⚖️  MOJ Backend v1.2.0 running on http://localhost:${config.port} [${config.env}]`);
  });
}

// Export for testing (supertest handles its own server lifecycle)
module.exports = app;
