/**
 * Health endpoint tests
 */
require('./setup');
const request = require('supertest');
const app = require('../server');

describe('GET /api/health', () => {
  it('returns 200 with system info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.system).toBe('MOJ Case Tracking System');
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data).toHaveProperty('version');
    expect(res.body.data).toHaveProperty('environment');
    expect(res.body.data).toHaveProperty('requestId');
  });
});

describe('GET /api/nonexistent', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Route not found.');
  });
});
