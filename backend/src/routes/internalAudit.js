/**
 * 管理员 / 内部：按 requestId 取回一次请求的审计链路。不是用户 API。
 */

const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const auditService = require('../services/auditService');

const router = express.Router();

function adminOrInternal(req, res, next) {
  const expected =
    process.env.INTERNAL_CRON_BEARER_TOKEN ||
    process.env.DOCTOR_AGENT_DAILY_WEBHOOK_TOKEN ||
    '';
  const header = req.headers.authorization || '';
  const token = (header.match(/^Bearer\s+(.+)$/i) || [])[1] || '';
  if (expected && token && token === expected) {
    return next();
  }
  return authenticateToken(req, res, (err) => {
    if (err) return next(err);
    return requireAdmin(req, res, next);
  });
}

router.get('/request/:requestId', adminOrInternal, async (req, res, next) => {
  try {
    const events = await auditService.getRequestTrail(req.params.requestId);
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
