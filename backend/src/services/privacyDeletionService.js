/**
 * 账号注销编排：冻结登录 → 记不可删的注销摘要 → 脱敏审计 → 清业务 PHI → 删/匿名化用户。
 * 已发到大模型的内容无法追回；本流程只保证今后不再处理该主体的明文数据。
 */

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const {
  userRepo,
  userProfileRepo,
  personalHealthRecordRepo,
  healthRecordRepo,
  chatHistoryRepo,
  userSettingsRepo,
  digitalTwinRepo,
  conversationRepo,
  reportRepo,
  riskAlertRepo,
  medicationRepo,
  wearableStreamDataRepo,
  userWearablesRepo,
  consentRepo,
  auditEventRepo
} = require('../repositories');
const auditService = require('./auditService');
const { AUDIT_ACTIONS } = require('../models/auditEvent');
const logger = require('../observability/logger');

function sanitizeUserId(email) {
  return (email || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function hashSubject(email) {
  const pepper = process.env.JWT_SECRET || 'privacy-deletion';
  return crypto.createHash('sha256').update(`erased:${String(email || '').toLowerCase()}:${pepper}`).digest('hex');
}

async function tryStep(name, fn) {
  try {
    const result = await fn();
    return { name, ok: true, result };
  } catch (err) {
    logger.warn({ err: { message: err?.message }, collection: name }, '注销时该集合未能清理，已跳过');
    return { name, ok: false, error: err?.message };
  }
}

async function callIfPresent(repo, method, ...args) {
  if (!repo || typeof repo[method] !== 'function') {
    const error = new Error(`${method} 未实现`);
    error.code = 'SKIP';
    throw error;
  }
  return repo[method](...args);
}

async function verifyPassword(email, password) {
  const user = await userRepo.getByEmail(email);
  if (!user) {
    const err = new Error('用户不存在');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  if (!user.passwordHash) {
    const err = new Error('该账号无法用密码确认注销，请联系支持');
    err.status = 400;
    err.code = 'PASSWORD_UNAVAILABLE';
    throw err;
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    const err = new Error('密码不正确');
    err.status = 403;
    err.code = 'PASSWORD_MISMATCH';
    throw err;
  }
  return user;
}

async function deleteAccount({ email, userId, password, confirmEmail }) {
  if (String(confirmEmail || '').trim().toLowerCase() !== String(email || '').trim().toLowerCase()) {
    const err = new Error('确认邮箱与当前账号不一致');
    err.status = 400;
    err.code = 'EMAIL_MISMATCH';
    throw err;
  }

  const user = await verifyPassword(email, password);
  const uid = userId || user.uid;
  const sanitized = sanitizeUserId(email);
  const hashed = hashSubject(email);

  await userRepo.updateByEmail(email, {
    disabled: true,
    deletedAt: new Date().toISOString(),
    deletionRequestedAt: new Date().toISOString()
  });

  await auditService.append({
    action: AUDIT_ACTIONS.ACCOUNT_ERASED,
    operation: 'privacy.deleteAccount',
    subjectEmail: hashed,
    actorEmail: hashed,
    actorId: uid || null,
    success: true,
    metadata: { retention: 'erasure_receipt', originalSubjectHashed: true }
  });

  const steps = [];

  steps.push(await tryStep('auditEvents.redact', () => callIfPresent(auditEventRepo, 'redactSummariesBySubject', email, hashed)));
  steps.push(await tryStep('consents.redact', () => callIfPresent(consentRepo, 'redactSubject', email, hashed)));

  steps.push(await tryStep('personalHealthRecords', () => callIfPresent(personalHealthRecordRepo, 'delete', sanitized)));
  steps.push(await tryStep('healthRecords', () => callIfPresent(healthRecordRepo, 'deleteByUser', sanitized)));
  steps.push(await tryStep('medications', () => callIfPresent(medicationRepo, 'deleteByUser', sanitized)));
  steps.push(await tryStep('chatHistory', () => callIfPresent(chatHistoryRepo, 'deleteByUser', email)));
  steps.push(await tryStep('conversations', () => callIfPresent(conversationRepo, 'deleteByUser', email)));
  steps.push(await tryStep('reports', () => callIfPresent(reportRepo, 'deleteByUser', email)));
  steps.push(await tryStep('riskAlerts', () => callIfPresent(riskAlertRepo, 'deleteByUser', email)));
  steps.push(await tryStep('wearableStreamData', () => callIfPresent(wearableStreamDataRepo, 'deleteByUser', email)));
  steps.push(await tryStep('userWearables', async () => {
    await callIfPresent(userWearablesRepo, 'deleteByUser', uid);
    if (email && email !== uid && typeof userWearablesRepo.deleteByUser === 'function') {
      try {
        await userWearablesRepo.deleteByUser(email);
      } catch {
        // uid 与 email 可能指向同一文档
      }
    }
  }));
  steps.push(await tryStep('digitalTwin', () => callIfPresent(digitalTwinRepo, 'deleteDigitalTwin', sanitized)));
  steps.push(await tryStep('userSettings', () => callIfPresent(userSettingsRepo, 'deleteUserSettings', uid)));
  steps.push(await tryStep('userProfile', () => callIfPresent(userProfileRepo, 'deleteByEmail', email)));
  steps.push(await tryStep('users', () => callIfPresent(userRepo, 'deleteByEmail', email)));

  const skipped = steps.filter((s) => !s.ok).map((s) => s.name);
  const completed = steps.filter((s) => s.ok).map((s) => s.name);

  return {
    status: skipped.length ? 'partial' : 'completed',
    hashedSubject: hashed,
    completed,
    skipped
  };
}

module.exports = { deleteAccount, hashSubject, verifyPassword };
