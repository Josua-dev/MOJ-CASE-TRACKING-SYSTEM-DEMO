/**
 * Test setup — set environment variables before any module loads.
 *
 * IMPORTANT: This file must be required BEFORE any application module.
 * It sets process.env overrides that config.js reads at module load time.
 */
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test_secret_not_for_production';
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
