/**
 * Shared configuration module
 * Centralises all config/env vars so they're not duplicated across files.
 */
const path = require('path');

// Load .env from project root (one level up from src/)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : ['http://localhost:3000'],
  },

  rateLimit: {
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_MIN, 10) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 10,
  },

  db: {
    path: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'magistrate.db'),
  },
};

// In development, provide a fallback JWT secret so .env isn't strictly required
if (!config.jwt.secret) {
  if (config.env === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is required in production.');
    process.exit(1);
  }
  config.jwt.secret = 'moj_namibia_dev_secret_2026';
  console.warn('WARN: Using development JWT secret. Set JWT_SECRET in .env for production.');
}

module.exports = config;
