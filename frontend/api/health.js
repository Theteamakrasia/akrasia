/**
 * api/health.js
 * GET /api/health — liveness check
 */

const prisma = require('./_lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      status:  'ok',
      db:      'connected',
      ts:      new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      status:  'degraded',
      db:      'unreachable',
    });
  }
};