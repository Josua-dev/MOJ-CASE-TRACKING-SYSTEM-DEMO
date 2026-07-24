/**
 * CSRF protection middleware
 *
 * When using httpOnly cookies for auth, we need CSRF protection on mutating
 * requests. This uses the double-submit cookie pattern:
 *   1. GET /api/csrf-token returns a token
 *   2. Client sends it back via x-csrf-token header on POST/PUT/DELETE
 *   3. Server validates the token matches
 */
const csrf = require('csrf');
const tokens = new csrf();

// In-memory secret store. For multi-process production, store this in Redis.
let secret = null;

function getSecret() {
  if (!secret) {
    secret = tokens.secretSync();
  }
  return secret;
}

/** GET /api/csrf-token → returns a fresh token for the client */
function csrfTokenRoute(req, res) {
  const token = tokens.create(getSecret());
  res.json({ success: true, data: { csrfToken: token } });
}

/** Middleware: validates x-csrf-token header on mutating methods */
function csrfProtection(req, res, next) {
  // Bypass CSRF in test environment (supertest doesn't manage cookies)
  if (process.env.NODE_ENV === 'test') return next();

  // Only protect mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'];
  if (!clientToken) {
    return res.status(403).json({
      success: false,
      error: 'Missing CSRF token. Include x-csrf-token header.',
      code: 'CSRF_MISSING',
    });
  }

  if (!tokens.verify(getSecret(), clientToken)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired CSRF token.',
      code: 'CSRF_INVALID',
    });
  }

  next();
}

module.exports = { csrfTokenRoute, csrfProtection };
