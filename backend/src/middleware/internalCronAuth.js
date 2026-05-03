/**
 * Bearer auth for internal cron HTTP triggers (Hermes / crontab / cloud scheduler).
 * Set INTERNAL_CRON_BEARER_TOKEN or reuse DOCTOR_AGENT_DAILY_WEBHOOK_TOKEN from the caller script.
 */

function internalCronAuth(req, res, next) {
  const expected =
    process.env.INTERNAL_CRON_BEARER_TOKEN ||
    process.env.DOCTOR_AGENT_DAILY_WEBHOOK_TOKEN ||
    '';

  if (!expected) {
    return res.status(503).json({
      success: false,
      error: 'Cron bearer not configured (INTERNAL_CRON_BEARER_TOKEN or DOCTOR_AGENT_DAILY_WEBHOOK_TOKEN)'
    });
  }

  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : '';

  if (token !== expected) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  return next();
}

module.exports = { internalCronAuth };
