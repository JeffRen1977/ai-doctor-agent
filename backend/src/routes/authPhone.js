/**
 * 手机号+短信验证码 认证路由。
 * 与 auth.js 的邮箱登录并列，共用 JWT 签发与同意记录逻辑。
 */

const express = require('express');
const Joi = require('joi');
const { signAuthToken } = require('../config/jwtConfig');
const { userRepo } = require('../repositories');
const smsService = require('../services/smsService');
const { smsLimiter, registerLimiter, loginLimiter } = require('../middleware/rateLimit');
const consentService = require('../services/consentService');
const { CONSENT_PURPOSES } = require('../models/consent');
const logger = require('../observability/logger');

const router = express.Router();

const PHONE_REGEX = /^1[3-9]\d{9}$/;

const sendSmsSchema = Joi.object({
  phone: Joi.string().pattern(PHONE_REGEX).required()
    .messages({ 'string.pattern.base': '请输入有效的中国手机号' })
});

const loginPhoneSchema = Joi.object({
  phone: Joi.string().pattern(PHONE_REGEX).required(),
  code: Joi.string().length(6).required()
});

const registerPhoneSchema = Joi.object({
  phone: Joi.string().pattern(PHONE_REGEX).required(),
  code: Joi.string().length(6).required(),
  name: Joi.string().min(2).max(50).required(),
  acceptTerms: Joi.boolean().valid(true).required(),
  acceptHealthAi: Joi.boolean().valid(true).required(),
  acceptCrossBorder: Joi.boolean().optional()
});

function syntheticEmail(phone) {
  return `${phone}@sms.local`;
}

async function recordRegistrationConsents(email, value) {
  try {
    const grants = [
      { purpose: CONSENT_PURPOSES.ACCOUNT, granted: true },
      { purpose: CONSENT_PURPOSES.HEALTH_STORAGE, granted: true },
      { purpose: CONSENT_PURPOSES.AI_INFERENCE, granted: true }
    ];
    if (value.acceptCrossBorder) {
      grants.push({ purpose: CONSENT_PURPOSES.CROSS_BORDER, granted: true });
    }
    for (const grant of grants) {
      const result = await consentService.recordConsent({
        subjectEmail: email,
        purpose: grant.purpose,
        granted: grant.granted,
        source: 'register-phone'
      });
      if (!result.recorded) {
        logger.error({ consentError: result.error, purpose: grant.purpose }, '手机注册同意落库失败');
      }
    }
  } catch (err) {
    logger.error({ err: { message: err?.message } }, '手机注册同意落库异常');
  }
}

/**
 * POST /api/auth/send-sms
 * 发送短信验证码
 */
router.post('/send-sms', smsLimiter, async (req, res) => {
  try {
    const { error, value } = sendSmsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await smsService.sendVerificationCode(value.phone);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const response = { success: true, expiresAt: result.expiresAt };
    if (result._devCode) {
      response._devCode = result._devCode;
    }
    return res.json(response);
  } catch (err) {
    logger.error({ err: { message: err?.message } }, 'send-sms error');
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/login-phone
 * 手机号+验证码登录
 */
router.post('/login-phone', loginLimiter, async (req, res) => {
  try {
    const { error, value } = loginPhoneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { phone, code } = value;

    const verify = await smsService.verifyCode(phone, code);
    if (!verify.valid) {
      return res.status(401).json({ error: verify.error });
    }

    const user = await userRepo.getByPhone(phone);
    if (!user) {
      return res.status(401).json({ error: '该手机号未注册' });
    }

    if (user.disabled || user.deletedAt) {
      return res.status(403).json({ error: '账号已注销' });
    }

    const token = signAuthToken({ userId: user.uid, email: user.email });
    return res.json({
      user: {
        id: user.uid,
        email: user.email,
        name: user.name,
        phone,
        avatar: user.avatar || null
      },
      token
    });
  } catch (err) {
    logger.error({ err: { message: err?.message } }, 'login-phone error');
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/register-phone
 * 手机号+验证码注册
 */
router.post('/register-phone', registerLimiter, async (req, res) => {
  try {
    const { error, value } = registerPhoneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { phone, code, name } = value;

    const verify = await smsService.verifyCode(phone, code);
    if (!verify.valid) {
      return res.status(400).json({ error: verify.error });
    }

    const existing = await userRepo.getByPhone(phone);
    if (existing) {
      return res.status(400).json({ error: '该手机号已被注册' });
    }

    const email = syntheticEmail(phone);
    const uid = 'sms-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);

    await userRepo.setByEmail(email, {
      uid,
      email,
      phone,
      name,
      passwordHash: null,
      avatar: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await recordRegistrationConsents(email, value);

    const token = signAuthToken({ userId: uid, email });
    return res.status(201).json({
      user: { id: uid, email, name, phone, avatar: null },
      token
    });
  } catch (err) {
    logger.error({ err: { message: err?.message } }, 'register-phone error');
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
