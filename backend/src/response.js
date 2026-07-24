/**
 * Standard API response envelope
 *
 * Every endpoint returns: { success, data?, error?, meta? }
 */
function success(res, data, meta = {}, status = 200) {
  const body = { success: true, data };
  if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
    body.meta = meta;
  }
  return res.status(status).json(body);
}

function error(res, status, message, details = null) {
  const body = { success: false, error: message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

module.exports = { success, error };
