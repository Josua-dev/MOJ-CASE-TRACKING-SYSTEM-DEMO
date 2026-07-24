/**
 * Notification helper — creates in-app notifications
 */
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');

/**
 * Create a notification for one or more users
 * @param {string} userId - single user ID (or broadcast to all admins if 'broadcast:admin')
 * @param {string} type - info, success, warning, danger
 * @param {string} title
 * @param {string} message
 * @param {string} link - optional deep link
 */
function createNotification(userId, type, title, message, link = '') {
  const ids = [];
  const users = [];

  if (userId === 'broadcast:admin') {
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin' AND active = 1").all();
    users.push(...admins);
  } else if (userId === 'broadcast:all') {
    const all = db.prepare('SELECT id FROM users WHERE active = 1').all();
    users.push(...all);
  } else {
    users.push({ id: userId });
  }

  const insert = db.prepare(
    'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)'
  );

  for (const u of users) {
    // Check user's notification preferences
    const prefs = db.prepare('SELECT in_app FROM notification_preferences WHERE user_id = ?').get(u.id);
    if (prefs && !prefs.in_app) continue;

    const id = uuidv4();
    insert.run(id, u.id, type, title, message, link);
    ids.push(id);
  }

  return ids;
}

/**
 * Create notifications for all users who can see a case
 */
function notifyCaseWatchers(caseId, type, title, message, link = '') {
  const watchers = db.prepare(`
    SELECT DISTINCT u.id FROM users u
    WHERE u.active = 1
  `).all();
  for (const w of watchers) {
    createNotification(w.id, type, title, message, link);
  }
}

module.exports = { createNotification, notifyCaseWatchers };
