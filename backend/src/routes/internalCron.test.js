/**
 * internalCron routes — bearer auth only (no Firebase in these tests).
 */

process.env.INTERNAL_CRON_BEARER_TOKEN = 'test-cron-secret';

jest.mock('../services/dailyReportCronService', () => ({
  runDailyReportBatch: jest.fn().mockResolvedValue({
    startedAt: new Date().toISOString(),
    dryRun: false,
    total: 0,
    results: [],
    message: 'ok'
  })
}));

const express = require('express');
const request = require('supertest');
const internalCronRoutes = require('./internalCron');
const dailyReportCronService = require('../services/dailyReportCronService');

describe('internalCron /daily-report', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/internal/cron', internalCronRoutes);
    dailyReportCronService.runDailyReportBatch.mockClear();
  });

  test('401 without Authorization', async () => {
    const res = await request(app).post('/internal/cron/daily-report').send({});
    expect(res.status).toBe(401);
  });

  test('401 with wrong bearer', async () => {
    const res = await request(app)
      .post('/internal/cron/daily-report')
      .set('Authorization', 'Bearer wrong')
      .send({});
    expect(res.status).toBe(401);
  });

  test('200 with valid bearer calls service', async () => {
    const res = await request(app)
      .post('/internal/cron/daily-report?dryRun=true')
      .set('Authorization', 'Bearer test-cron-secret')
      .send({ userEmails: ['a@example.com'] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(dailyReportCronService.runDailyReportBatch).toHaveBeenCalledWith({
      userEmails: ['a@example.com'],
      dryRun: true
    });
  });
});
