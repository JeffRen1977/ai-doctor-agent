const express = require('express');
const bcrypt = require('bcryptjs');
const { signAuthToken, verifyAuthTokenAllowExpired } = require('../config/jwtConfig');
const Joi = require('joi');
const firebaseService = require('../services/firebaseService');
const adapters = require('../adapters');
const { userRepo } = require('../repositories');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middleware/rateLimit');
const { authenticateToken } = require('../middleware/auth');
const passwordResetService = require('../services/passwordResetService');
const logger = require('../observability/logger');
const consentService = require('../services/consentService');
const { CONSENT_PURPOSES } = require('../models/consent');

const router = express.Router();
// 由「当前加载的 adapter」决定认证方式，不读 env，避免 .env 未生效仍走 Firebase
function useMongoAuth() {
  return !!adapters.__useMongoAuth;
}

// 登录验证schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// 注册验证schema
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
  acceptTerms: Joi.boolean().valid(true).required(),
  acceptHealthAi: Joi.boolean().valid(true).required(),
  acceptCrossBorder: Joi.boolean().optional()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().min(16).required(),
  password: Joi.string().min(8).required()
});

function emailsEqual(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function assertOwnEmail(req, res, emailParam) {
  if (!emailsEqual(req.user?.email, emailParam)) {
    res.status(403).json({ error: '只能访问自己的资料' });
    return false;
  }
  return true;
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
        source: 'register'
      });
      if (!result.recorded) {
        logger.error({ consentError: result.error, purpose: grant.purpose }, '注册同意落库失败');
      }
    }
  } catch (err) {
    logger.error({ err: { message: err?.message } }, '注册同意落库异常');
  }
}

// 用户注册
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, name } = value;

    const mongoAuth = useMongoAuth();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth/register] useMongoAuth=' + mongoAuth + ' (由当前 adapter 决定)');
    }
    if (mongoAuth) {
      // MongoDB：本地认证，不经过 Firebase Auth
      const existing = await userRepo.getByEmail(email);
      if (existing) {
        return res.status(400).json({ error: '该邮箱已被注册' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const uid = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
      await userRepo.setByEmail(email, {
        uid,
        email,
        name,
        passwordHash,
        avatar: null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await recordRegistrationConsents(email, value);
      const token = signAuthToken({ userId: uid, email });
      return res.status(201).json({
        user: { id: uid, email, name, avatar: null },
        token
      });
    }

    // Firebase：检查并注册
    const userExists = await firebaseService.checkUserExists(email);
    if (userExists) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }
    const result = await firebaseService.registerUser(email, password, name);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    await recordRegistrationConsents(result.user.email || email, value);
    const token = signAuthToken({ userId: result.user.id, email: result.user.email });
    res.status(201).json({
      user: result.user,
      token
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登录
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    if (useMongoAuth()) {
      // MongoDB：本地认证，校验密码哈希
      const userData = await userRepo.getByEmail(email);
      if (!userData || !userData.passwordHash) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }
      if (userData.disabled || userData.deletedAt) {
        return res.status(403).json({ error: '账号已注销' });
      }
      const match = await bcrypt.compare(password, userData.passwordHash);
      if (!match) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }
      const token = signAuthToken({ userId: userData.uid, email: userData.email });
      return res.json({
        user: {
          id: userData.uid,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar
        },
        token
      });
    }

    // Firebase 认证
    const result = await firebaseService.loginUser(email, password);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    const token = signAuthToken({ userId: result.user.id, email: result.user.email });
    res.json({
      user: result.user,
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// Token刷新：必须出示现有 JWT（允许在宽限内过期），不能只用 userId+email 换票
router.post('/refresh-token', async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: '未提供认证token' });
  }

  try {
    const decoded = verifyAuthTokenAllowExpired(token);
    const userResult = await firebaseService.getUserById(decoded.userId);
    if (!userResult.success) {
      return res.status(401).json({ error: '用户不存在' });
    }
    if (decoded.email && !emailsEqual(decoded.email, userResult.user.email)) {
      return res.status(401).json({ error: '无效的token' });
    }

    const newToken = signAuthToken({
      userId: userResult.user.id,
      email: userResult.user.email
    });
    return res.json({
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    logger.warn({ err: { message: error?.message } }, 'token refresh rejected');
    return res.status(401).json({ error: '无效的token' });
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const genericMessage = '如果该邮箱已注册，您将收到重置邮件';
  const { error, value } = forgotPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    if (useMongoAuth()) {
      await passwordResetService.requestMongoReset(value.email);
    } else {
      await passwordResetService.requestFirebaseReset(value.email);
    }
  } catch (err) {
    logger.error({ err: { message: err?.message } }, 'forgot-password failed');
  }
  return res.json({ message: genericMessage });
});

router.post('/reset-password', async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  if (!useMongoAuth()) {
    return res.status(400).json({ error: '请使用邮件中的链接重置密码' });
  }
  try {
    const result = await passwordResetService.confirmMongoReset(value.token, value.password);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ message: '密码已重置，请使用新密码登录' });
  } catch (err) {
    logger.error({ err: { message: err?.message } }, 'reset-password failed');
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登出
router.post('/logout', async (req, res) => {
  try {
    const result = await firebaseService.logoutUser();
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  return res.json(req.user);
});

async function readOwnProfile(req, res) {
  try {
    const result = await firebaseService.getUserProfile(req.user.email);
    if (!result.success) {
      return res.json({
        profile: { email: req.user.email, name: req.user.name || '' }
      });
    }
    return res.json({ profile: result.profile });
  } catch (error) {
    logger.error({ err: { message: error?.message } }, 'get profile failed');
    return res.status(500).json({ error: '服务器内部错误' });
  }
}

async function writeOwnProfile(req, res) {
  try {
    const { name, avatar, email: _ignoredEmail, ...profileFields } = req.body || {};
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (avatar !== undefined) userUpdates.avatar = avatar;
    if (Object.keys(userUpdates).length > 0) {
      const userResult = await firebaseService.updateUser(req.user.id, userUpdates);
      if (!userResult.success) {
        return res.status(400).json({ error: userResult.error });
      }
    }

    const profileData = { ...profileFields };
    if (name) profileData.name = name;
    const result = await firebaseService.updateUserProfile(req.user.email, profileData);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ message: '用户资料更新成功', profile: result.profile });
  } catch (error) {
    logger.error({ err: { message: error?.message } }, 'update profile failed');
    return res.status(500).json({ error: '服务器内部错误' });
  }
}

router.get('/profile', authenticateToken, readOwnProfile);
router.put('/profile', authenticateToken, writeOwnProfile);

router.get('/profile/:email', authenticateToken, async (req, res) => {
  if (!assertOwnEmail(req, res, req.params.email)) return;
  return readOwnProfile(req, res);
});

router.put('/profile/:email', authenticateToken, async (req, res) => {
  if (!assertOwnEmail(req, res, req.params.email)) return;
  return writeOwnProfile(req, res);
});

module.exports = router; 