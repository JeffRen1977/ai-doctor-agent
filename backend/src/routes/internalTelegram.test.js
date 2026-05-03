process.env.TELEGRAM_WEBHOOK_SECRET = 'whsec-test';

jest.mock('../services/telegramIntegrationService', () => ({
  bindTelegramChat: jest.fn().mockResolvedValue({ ok: true }),
  sendTelegramText: jest.fn().mockResolvedValue({ sent: true })
}));

const express = require('express');
const request = require('supertest');
const internalTelegramRoutes = require('./internalTelegram');

describe('internalTelegram /webhook', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/internal/telegram', internalTelegramRoutes);
  });

  test('403 without secret header when TELEGRAM_WEBHOOK_SECRET set', async () => {
    const res = await request(app)
      .post('/internal/telegram/webhook')
      .send({ message: { chat: { id: 1 }, text: 'ABCDEF' } });
    expect(res.status).toBe(403);
  });

  test('200 with valid secret', async () => {
    const res = await request(app)
      .post('/internal/telegram/webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', 'whsec-test')
      .send({ message: { chat: { id: 1 }, text: 'ABCDEF' } });
    expect(res.status).toBe(200);
  });
});
