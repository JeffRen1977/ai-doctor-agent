/**
 * 同意服务：登记、查询当前有效同意、给路由做门控。
 */

const { consentRepo } = require('../repositories');
const { validateConsent, CONSENT_PURPOSES, currentPolicyVersion } = require('../models/consent');
const { getContext } = require('../observability/requestContext');
const logger = require('../observability/logger');

function enforcementEnabled() {
  return process.env.CONSENT_ENFORCE !== 'false';
}

async function recordConsent({ subjectEmail, purpose, granted, source }) {
  const context = getContext();
  const candidate = {
    subjectEmail,
    purpose,
    granted: granted !== false,
    policyVersion: currentPolicyVersion(),
    timestamp: new Date().toISOString(),
    requestId: context.requestId || null,
    actorId: context.userId || null,
    source: source || 'settings'
  };
  const { valid, error, value } = validateConsent(candidate);
  if (!valid) {
    logger.error({ consentError: error, purpose }, '同意记录校验失败');
    return { recorded: false, error };
  }
  const saved = await consentRepo.appendConsent(value);
  return { recorded: true, id: saved?.id, consent: saved };
}

async function listConsents(subjectEmail) {
  return consentRepo.listBySubject(subjectEmail, { limit: 200 });
}

/** 每个 purpose 取最新一条，且须匹配当前政策版本才算有效授予 */
async function getCurrentConsents(subjectEmail) {
  const rows = await listConsents(subjectEmail);
  const latest = {};
  rows.forEach((row) => {
    if (!latest[row.purpose]) latest[row.purpose] = row;
  });
  const version = currentPolicyVersion();
  const status = {};
  Object.values(CONSENT_PURPOSES).forEach((purpose) => {
    const row = latest[purpose];
    status[purpose] = {
      granted: !!(row && row.granted && row.policyVersion === version),
      policyVersion: row?.policyVersion || null,
      timestamp: row?.timestamp || null,
      currentPolicyVersion: version
    };
  });
  return status;
}

async function hasConsent(subjectEmail, purpose) {
  if (!subjectEmail) return false;
  const status = await getCurrentConsents(subjectEmail);
  return !!status[purpose]?.granted;
}

async function assertConsent(subjectEmail, purpose) {
  if (!enforcementEnabled()) return;
  const ok = await hasConsent(subjectEmail, purpose);
  if (!ok) {
    const error = new Error('需要先同意相关数据处理');
    error.status = 403;
    error.code = 'CONSENT_REQUIRED';
    error.purpose = purpose;
    throw error;
  }
}

const CROSS_BORDER_PROVIDERS = new Set(['openai', 'gemini']);

async function assertCanCallAi(subjectEmail, provider) {
  if (!enforcementEnabled()) return;
  await assertConsent(subjectEmail, CONSENT_PURPOSES.AI_INFERENCE);
  if (CROSS_BORDER_PROVIDERS.has(String(provider || '').toLowerCase())) {
    await assertConsent(subjectEmail, CONSENT_PURPOSES.CROSS_BORDER);
  }
}

module.exports = {
  recordConsent,
  listConsents,
  getCurrentConsents,
  hasConsent,
  assertConsent,
  assertCanCallAi,
  enforcementEnabled,
  CROSS_BORDER_PROVIDERS,
  CONSENT_PURPOSES,
  currentPolicyVersion
};
