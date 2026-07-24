/**
 * Request ID middleware
 *
 * Every request gets a unique ID for tracing across logs.
 * If the client sends an x-request-id header, it's forwarded (useful for
 * correlating frontend ↔ backend log entries).
 */
const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.id);
  next();
}

module.exports = requestId;
