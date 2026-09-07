/**
 * 找回密码：Mongo 存令牌哈希并发自家邮件；Firebase Auth 走官方重置邮件。
 * 调用方应对「邮箱是否存在」返回同一响应，本服务内部也按这个原则处理 Firebase 抛错。
 */

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('firebase/auth');
const { auth } = require('../config/firebase');
const { userRepo } = require('../repositories');
const { sendPasswordResetMail } = require('./mailer');
const logger = require('../observability/logger');

const TTL_MIN = Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 60;

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function resetUrlFor(rawToken) {
  const base = String(process.env.PASSWORD_RESET_URL || 'http://localhost:3000').replace(/\/$/, '');
  const join = base.includes('?') ? '&' : '?';
  return `${base}${join}resetToken=${encodeURIComponent(rawToken)}`;
}

async function requestMongoReset(email) {
  const user = await userRepo.getByEmail(email);
  if (!user) return { accepted: true };

  const raw = crypto.randomBytes(32).toString('hex');
  const userEmail = user.email || email;
  await userRepo.updateByEmail(userEmail, {
    passwordResetTokenHash: hashToken(raw),
    passwordResetExpiresAt: new Date(Date.now() + TTL_MIN * 60 * 1000).toISOString(),
    updatedAt: new Date()
  });
  try {
    await sendPasswordResetMail(userEmail, resetUrlFor(raw));
  } catch (err) {
    logger.error({ err: { message: err?.message }, to: userEmail }, '密码重置邮件发送失败');
  }
  return { accepted: true };
}

async function requestFirebaseReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    // user-not-found 等错误不得传到客户端，否则可以枚举账号
    logger.info({ err: { message: err?.message } }, 'Firebase 重置邮件未发送（可能邮箱未注册）');
  }
  return { accepted: true };
}

async function confirmMongoReset(rawToken, password) {
  const user = await userRepo.findByPasswordResetHash(hashToken(rawToken));
  if (!user?.email) {
    return { success: false, error: '重置链接无效或已过期' };
  }
  const expiresAt = user.passwordResetExpiresAt ? new Date(user.passwordResetExpiresAt).getTime() : 0;
  if (!expiresAt || Date.now() > expiresAt) {
    return { success: false, error: '重置链接无效或已过期' };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await userRepo.updateByEmail(user.email, {
    passwordHash,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    updatedAt: new Date()
  });
  return { success: true };
}

module.exports = {
  hashToken,
  resetUrlFor,
  requestMongoReset,
  requestFirebaseReset,
  confirmMongoReset
};
