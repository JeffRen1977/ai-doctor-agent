/**
 * 隐私权利 API：同意、访问日志、导出、注销。只操作 req.user。
 */

const express = require('express');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const { CONSENT_PURPOSES } = require('../models/consent');
const consentService = require('../services/consentService');
const auditService = require('../services/auditService');
const { AUDIT_ACTIONS } = require('../models/auditEvent');
const privacyExportService = require('../services/privacyExportService');
const privacyDeletionService = require('../services/privacyDeletionService');

const router = express.Router();

const USER_VISIBLE_ACTIONS = new Set([
  AUDIT_ACTIONS.RECORD_ACCESSED,
  AUDIT_ACTIONS.AI_DECISION,
  AUDIT_ACTIONS.ACCOUNT_EXPORTED
]);

const consentBodySchema = Joi.object({
  purpose: Joi.string().valid(...Object.values(CONSENT_PURPOSES)).required(),
  granted: Joi.boolean().required()
});

const deleteBodySchema = Joi.object({
  password: Joi.string().min(1).required(),
  confirmEmail: Joi.string().email().required()
});

router.get('/consents', authenticateToken, async (req, res, next) => {
  try {
    const email = req.user.email;
    const current = await consentService.getCurrentConsents(email);
    res.json({
      success: true,
      policyVersion: consentService.currentPolicyVersion(),
      privacyPolicyUrl: process.env.PRIVACY_POLICY_URL || '/privacy',
      termsUrl: process.env.TERMS_URL || '/terms',
      consents: current
    });
  } catch (err) {
    next(err);
  }
});

router.post('/consents', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = consentBodySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const result = await consentService.recordConsent({
      subjectEmail: req.user.email,
      purpose: value.purpose,
      granted: value.granted,
      source: 'settings'
    });
    if (!result.recorded) {
      return res.status(400).json({ success: false, error: result.error });
    }
    const current = await consentService.getCurrentConsents(req.user.email);
    res.json({ success: true, consents: current });
  } catch (err) {
    next(err);
  }
});

router.get('/access-log', authenticateToken, async (req, res, next) => {
  try {
    const rows = await auditService.getSubjectTrail(req.user.email, { limit: 100 });
    const events = (rows || [])
      .filter((row) => USER_VISIBLE_ACTIONS.has(row.action))
      .map((row) => ({
        timestamp: row.timestamp,
        action: row.action,
        operation: row.operation,
        success: row.success,
        provider: row.provider || null
      }));
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
});

router.post('/export', authenticateToken, async (req, res, next) => {
  try {
    const result = await privacyExportService.createExportJob({
      email: req.user.email,
      userId: req.user.id
    });
    res.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
      expiresAt: result.expiresAt,
      data: result.payload
    });
  } catch (err) {
    next(err);
  }
});

router.get('/export/:jobId', authenticateToken, async (req, res, next) => {
  try {
    const result = await privacyExportService.getExportJob(req.params.jobId, req.user.email);
    if (!result.found) {
      return res.status(404).json({ success: false, error: '导出任务不存在' });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, error: '只能下载自己的导出' });
    }
    if (result.expired) {
      return res.status(410).json({ success: false, error: '导出已过期，请重新申请' });
    }
    res.json({
      success: true,
      jobId: result.job.id,
      status: result.job.status,
      expiresAt: result.job.expiresAt,
      data: result.job.payload
    });
  } catch (err) {
    next(err);
  }
});

router.post('/delete-account', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = deleteBodySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const result = await privacyDeletionService.deleteAccount({
      email: req.user.email,
      userId: req.user.id,
      password: value.password,
      confirmEmail: value.confirmEmail
    });
    res.json({
      success: true,
      status: result.status,
      skipped: result.skipped
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
