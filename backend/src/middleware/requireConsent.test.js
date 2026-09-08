process.env.CONSENT_ENFORCE = 'true';

jest.mock('../services/consentService', () => ({
  enforcementEnabled: () => true,
  assertConsent: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const { requireConsent } = require('./requireConsent');
const consentService = require('../services/consentService');

function app() {
  const server = express();
  server.get('/ai', (req, res, next) => {
    req.user = { email: 'me@test.com' };
    next();
  }, requireConsent('ai_inference'), (req, res) => res.json({ ok: true }));
  return server;
}

describe('requireConsent', () => {
  beforeEach(() => {
    consentService.assertConsent.mockReset();
  });

  test('passes when consent is present', async () => {
    consentService.assertConsent.mockResolvedValue(undefined);
    const res = await request(app()).get('/ai');
    expect(res.status).toBe(200);
    expect(consentService.assertConsent).toHaveBeenCalledWith('me@test.com', 'ai_inference');
  });

  test('returns 403 CONSENT_REQUIRED when missing', async () => {
    const err = new Error('需要先同意相关数据处理');
    err.status = 403;
    err.code = 'CONSENT_REQUIRED';
    err.purpose = 'ai_inference';
    consentService.assertConsent.mockRejectedValue(err);
    const res = await request(app()).get('/ai');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CONSENT_REQUIRED');
    expect(res.body.purpose).toBe('ai_inference');
  });
});
