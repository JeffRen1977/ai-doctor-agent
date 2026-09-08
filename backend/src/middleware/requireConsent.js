/**
 * 同意门控：authenticateToken 之后检查指定 purpose 是否仍有效。
 * CONSENT_ENFORCE=false 时跳过（单测 / 本地联调）。
 */

const consentService = require('../services/consentService');

function requireConsent(...purposes) {
  return async function requireConsentMiddleware(req, res, next) {
    try {
      if (!consentService.enforcementEnabled()) return next();
      const email = req.user?.email;
      for (const purpose of purposes) {
        await consentService.assertConsent(email, purpose);
      }
      return next();
    } catch (err) {
      if (err?.code === 'CONSENT_REQUIRED') {
        return res.status(403).json({
          success: false,
          error: err.message,
          code: 'CONSENT_REQUIRED',
          purpose: err.purpose
        });
      }
      return next(err);
    }
  };
}

module.exports = { requireConsent };
