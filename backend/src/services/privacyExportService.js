/**
 * 用户数据导出。第一版同步生成 JSON，落 privacyJobs，24 小时内可再取。
 * 不含 passwordHash、重置令牌、第三方 OAuth 令牌；文档只出元数据，不出文件原文。
 */

const { privacyJobRepo, consentRepo, personalHealthRecordRepo, medicationRepo, userRepo, userProfileRepo, healthRecordRepo, chatHistoryRepo, conversationRepo, reportRepo } = require('../repositories');
const auditService = require('./auditService');
const { AUDIT_ACTIONS } = require('../models/auditEvent');
const logger = require('../observability/logger');

const EXPORT_TTL_MS = 24 * 60 * 60 * 1000;

function sanitizeUserId(email) {
  return (email || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function stripSecrets(account) {
  if (!account || typeof account !== 'object') return account;
  const {
    passwordHash,
    password,
    passwordResetTokenHash,
    passwordResetExpiresAt,
    fitbitTokens,
    ...safe
  } = account;
  return safe;
}

function documentMetadata(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map((doc) => ({
    documentId: doc.documentId || doc.id || null,
    fileName: doc.fileName || doc.name || null,
    documentType: doc.documentType || doc.type || null,
    mimeType: doc.mimeType || null,
    uploadedAt: doc.uploadedAt || doc.createdAt || null,
    size: doc.size || doc.fileSize || null
  }));
}

function stripRecordPhiFiles(record) {
  if (!record || typeof record !== 'object') return record;
  const { medicalDocuments, ...rest } = record;
  return {
    ...rest,
    medicalDocuments: documentMetadata(medicalDocuments)
  };
}

async function safe(label, fn) {
  try {
    return await fn();
  } catch (err) {
    logger.warn({ err: { message: err?.message }, collection: label }, '导出时该集合读取失败，已跳过');
    return { _skipped: true, error: err?.message };
  }
}

async function createExportJob({ email, userId }) {
  const sanitized = sanitizeUserId(email);
  const accountRaw = await safe('users', () => userRepo.getByEmail(email));
  const profile = await safe('userProfile', () => userProfileRepo.getByEmail(email));
  const health = await safe('personalHealthRecords', () => personalHealthRecordRepo.get(sanitized));
  const medications = await safe('medications', () => medicationRepo.listActive(sanitized));
  const healthRecords = await safe('healthRecords', () => healthRecordRepo.getByUser(sanitized));
  const chat = await safe('chatHistory', () => chatHistoryRepo.getByUser(email));
  const conversations = conversationRepo.listByUser
    ? await safe('conversations', () => conversationRepo.listByUser(email, 50))
    : [];
  const reports = reportRepo.listReportsByUser
    ? await safe('reports', () => reportRepo.listReportsByUser(email, { limit: 50 }))
    : [];
  const consents = await safe('consents', () => consentRepo.listBySubject(email, { limit: 200 }));
  const audit = await safe('auditEvents', () => auditService.getSubjectTrail(email, { limit: 200 }));

  const payload = {
    exportedAt: new Date().toISOString(),
    subjectEmail: email,
    account: stripSecrets(accountRaw && !accountRaw._skipped ? accountRaw : null),
    profile: profile && !profile._skipped ? profile : null,
    health: {
      personalHealthRecord: health && !health._skipped ? stripRecordPhiFiles(health) : null,
      medications: medications && !medications._skipped ? medications : [],
      healthRecords: healthRecords && !healthRecords._skipped ? stripRecordPhiFiles(healthRecords) : null
    },
    aiHistory: {
      chatHistory: chat && !chat._skipped ? chat : null,
      conversations: conversations && !conversations._skipped ? conversations : [],
      reports: reports && !reports._skipped ? reports : []
    },
    consents: consents && !consents._skipped ? consents : [],
    audit: audit && !audit._skipped ? audit : []
  };

  const expiresAt = new Date(Date.now() + EXPORT_TTL_MS).toISOString();
  const job = await privacyJobRepo.createJob({
    subjectEmail: email,
    actorId: userId || null,
    type: 'export',
    status: 'ready',
    payload,
    expiresAt
  });

  await auditService.append({
    action: AUDIT_ACTIONS.ACCOUNT_EXPORTED,
    operation: 'privacy.export',
    subjectEmail: email,
    actorEmail: email,
    success: true,
    metadata: { jobId: job.id, expiresAt }
  });

  return {
    jobId: job.id,
    status: job.status,
    expiresAt,
    payload
  };
}

async function getExportJob(jobId, requesterEmail) {
  const job = await privacyJobRepo.getJob(jobId);
  if (!job) return { found: false };
  if (String(job.subjectEmail || '').toLowerCase() !== String(requesterEmail || '').toLowerCase()) {
    return { found: true, forbidden: true };
  }
  if (job.expiresAt && new Date(job.expiresAt).getTime() < Date.now()) {
    return { found: true, expired: true, job };
  }
  return { found: true, job };
}

module.exports = { createExportJob, getExportJob, stripSecrets };
