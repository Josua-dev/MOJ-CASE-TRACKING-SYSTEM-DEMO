/**
 * JWT authentication middleware
 *
 * Checks for a valid JWT in order of preference:
 *   1. Authorization header (Bearer token)
 *   2. httpOnly cookie named "moj_token"
 */
const jwt = require('jsonwebtoken');
const config = require('../src/config');
const { error } = require('../src/response');

function auth(req, res, next) {
  let token = null;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Fallback to httpOnly cookie
  if (!token && req.cookies && req.cookies.moj_token) {
    token = req.cookies.moj_token;
  }

  if (!token) {
    return error(res, 401, 'Unauthorized — no token provided.');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, 401, 'Invalid or expired token.');
  }
}

module.exports = auth;
