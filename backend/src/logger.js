/**
 * Structured logger using Pino
 *
 * Usage:
 *   const logger = require('./src/logger');
 *   logger.info({ userId, action }, 'Case created');
 *   logger.error({ err, caseId }, 'Failed to update case');
 */
const pino = require('pino');
const config = require('./config');

const logger = pino({
  level: config.env === 'production' ? 'info' : 'debug',
  ...(config.env === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
    },
  }),
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
    censor: '[REDACTED]',
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

module.exports = logger;
