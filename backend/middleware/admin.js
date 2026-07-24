/**
 * Admin authorisation middleware
 *
 * Requires that the authenticated user has the 'admin' role.
 * Must be used after the auth middleware so req.user is populated.
 */
const { error } = require('../src/response');

function admin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Forbidden — admin access required.');
  }
  next();
}

module.exports = admin;
