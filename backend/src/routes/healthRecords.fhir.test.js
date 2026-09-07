/**
 * FHIR import is a public-HAPI demo: must be authenticated, self-only, and off in production.
 */

process.env.RATE_LIMIT_DISABLED = 'true';

const express = require('express');
const request = require('supertest');

const mockGetPatientRecords = jest.fn().mockResolvedValue([{ resource: { id: '1' } }]);

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: '未提供认证token' });
    }
    req.user = { id: 'u1', email: 'me@test.com' };
    return next();
  }
}));

jest.mock('../services/fhirService', () => ({
  getPatientRecords: (...args) => mockGetPatientRecords(...args)
}));

jest.mock('../services/firebaseService', () => ({}));
jest.mock('../services/pdfCaseExtractionService', () => ({}));
jest.mock('../repositories', () => ({
  medicationRepo: {},
  personalHealthRecordRepo: {}
}));

const healthRecordsRoutes = require('./healthRecords');

function app() {
  const server = express();
  server.use(express.json());
  server.use('/api/health-records', healthRecordsRoutes);
  return server;
}

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  mockGetPatientRecords.mockClear();
});

describe('GET /api/health-records/fhir/:patientId', () => {
  test('returns 401 without a token', async () => {
    process.env.NODE_ENV = 'test';
    const res = await request(app()).get('/api/health-records/fhir/me@test.com');
    expect(res.status).toBe(401);
  });

  test('returns 403 when querying another patient id', async () => {
    process.env.NODE_ENV = 'test';
    const res = await request(app())
      .get('/api/health-records/fhir/other@test.com')
      .set('Authorization', 'Bearer test');
    expect(res.status).toBe(403);
    expect(mockGetPatientRecords).not.toHaveBeenCalled();
  });

  test('returns 404 in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app())
      .get('/api/health-records/fhir/me@test.com')
      .set('Authorization', 'Bearer test');
    expect(res.status).toBe(404);
    expect(mockGetPatientRecords).not.toHaveBeenCalled();
  });

  test('allows the current user in non-production', async () => {
    process.env.NODE_ENV = 'test';
    const res = await request(app())
      .get('/api/health-records/fhir/me@test.com')
      .set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(mockGetPatientRecords).toHaveBeenCalledWith('me@test.com');
  });
});
