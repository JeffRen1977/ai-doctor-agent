/**
 * 隐私权利 API：同意、访问日志、导出、注销。
 */

process.env.CONSENT_ENFORCE = 'true';
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.NODE_ENV = 'test';

const express = require('express');
const request = require('supertest');

const mockGetCurrentConsents = jest.fn();
const mockRecordConsent = jest.fn();
const mockGetSubjectTrail = jest.fn();
const mockCreateExportJob = jest.fn();
const mockGetExportJob = jest.fn();
const mockDeleteAccount = jest.fn();

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'user_1', email: 'me@test.com' };
    next();
  }
}));

jest.mock('../services/consentService', () => ({
  getCurrentConsents: (...args) => mockGetCurrentConsents(...args),
  recordConsent: (...args) => mockRecordConsent(...args),
  currentPolicyVersion: () => '2026-09-07',
  CONSENT_PURPOSES: {
    ACCOUNT: 'account',
    HEALTH_STORAGE: 'health_storage',
    AI_INFERENCE: 'ai_inference',
    ANALYTICS: 'analytics',
    CROSS_BORDER: 'cross_border'
  }
}));

jest.mock('../services/auditService', () => ({
  getSubjectTrail: (...args) => mockGetSubjectTrail(...args),
  AUDIT_ACTIONS: {
    RECORD_ACCESSED: 'record.accessed',
    AI_DECISION: 'ai.decision',
    ACCOUNT_EXPORTED: 'account.exported'
  }
}));

jest.mock('../models/auditEvent', () => ({
  AUDIT_ACTIONS: {
    RECORD_ACCESSED: 'record.accessed',
    AI_DECISION: 'ai.decision',
    ACCOUNT_EXPORTED: 'account.exported'
  }
}));

jest.mock('../services/privacyExportService', () => ({
  createExportJob: (...args) => mockCreateExportJob(...args),
  getExportJob: (...args) => mockGetExportJob(...args)
}));

jest.mock('../services/privacyDeletionService', () => ({
  deleteAccount: (...args) => mockDeleteAccount(...args)
}));

const privacyRoutes = require('./privacy');

function app() {
  const server = express();
  server.use(express.json());
  server.use('/api/privacy', privacyRoutes);
  return server;
}

beforeEach(() => {
  mockGetCurrentConsents.mockReset().mockResolvedValue({
    ai_inference: { granted: true, policyVersion: '2026-09-07', timestamp: '2026-09-07T00:00:00.000Z', currentPolicyVersion: '2026-09-07' }
  });
  mockRecordConsent.mockReset().mockResolvedValue({ recorded: true, id: 'c1' });
  mockGetSubjectTrail.mockReset().mockResolvedValue([
    { action: 'ai.decision', operation: 'healthChat', success: true, timestamp: '2026-09-07T00:00:00.000Z', provider: 'qwen' },
    { action: 'alert.generated', operation: 'risk', success: true, timestamp: '2026-09-07T00:00:00.000Z' }
  ]);
  mockCreateExportJob.mockReset().mockResolvedValue({
    jobId: 'job_1',
    status: 'ready',
    expiresAt: '2099-01-01T00:00:00.000Z',
    payload: { account: { email: 'me@test.com' } }
  });
  mockGetExportJob.mockReset();
  mockDeleteAccount.mockReset().mockResolvedValue({ status: 'completed', skipped: [] });
});

describe('GET /api/privacy/consents', () => {
  test('returns current consents for the authenticated user', async () => {
    const res = await request(app()).get('/api/privacy/consents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.consents.ai_inference.granted).toBe(true);
    expect(mockGetCurrentConsents).toHaveBeenCalledWith('me@test.com');
  });
});

describe('POST /api/privacy/consents', () => {
  test('records withdrawal of ai_inference', async () => {
    const res = await request(app())
      .post('/api/privacy/consents')
      .send({ purpose: 'ai_inference', granted: false });
    expect(res.status).toBe(200);
    expect(mockRecordConsent).toHaveBeenCalledWith(expect.objectContaining({
      subjectEmail: 'me@test.com',
      purpose: 'ai_inference',
      granted: false
    }));
  });
});

describe('GET /api/privacy/access-log', () => {
  test('returns only user-visible actions without summaries', async () => {
    const res = await request(app()).get('/api/privacy/access-log');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].action).toBe('ai.decision');
    expect(res.body.events[0].operation).toBe('healthChat');
    expect(res.body.events[0].outputSummary).toBeUndefined();
  });
});

describe('POST /api/privacy/export', () => {
  test('returns a ready export job', async () => {
    const res = await request(app()).post('/api/privacy/export');
    expect(res.status).toBe(200);
    expect(res.body.jobId).toBe('job_1');
    expect(res.body.data.account.email).toBe('me@test.com');
  });
});

describe('POST /api/privacy/delete-account', () => {
  test('requires password and matching email', async () => {
    const bad = await request(app()).post('/api/privacy/delete-account').send({ password: 'x' });
    expect(bad.status).toBe(400);
    const ok = await request(app()).post('/api/privacy/delete-account').send({
      password: 'secret',
      confirmEmail: 'me@test.com'
    });
    expect(ok.status).toBe(200);
    expect(mockDeleteAccount).toHaveBeenCalledWith(expect.objectContaining({
      email: 'me@test.com',
      password: 'secret'
    }));
  });
});
