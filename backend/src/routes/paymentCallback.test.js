jest.mock('../services/paymentService');
jest.mock('../observability/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const paymentCallbackRoutes = require('./paymentCallback');
const paymentService = require('../services/paymentService');

const app = express();
app.use('/payment/callback', paymentCallbackRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /payment/callback/wechat/notify', () => {
  it('returns SUCCESS on valid callback', async () => {
    paymentService.handleWeChatPayCallback.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/payment/callback/wechat/notify')
      .set('Content-Type', 'application/json')
      .send({ resource: {} });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('SUCCESS');
  });

  it('returns FAIL on verification failure', async () => {
    paymentService.handleWeChatPayCallback.mockResolvedValue({ success: false, error: 'bad_sig' });

    const res = await request(app)
      .post('/payment/callback/wechat/notify')
      .set('Content-Type', 'application/json')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('FAIL');
  });

  it('returns 500 on exception', async () => {
    paymentService.handleWeChatPayCallback.mockRejectedValue(new Error('db error'));

    const res = await request(app)
      .post('/payment/callback/wechat/notify')
      .set('Content-Type', 'application/json')
      .send({});

    expect(res.status).toBe(500);
  });
});

describe('POST /payment/callback/alipay/notify', () => {
  it('returns "success" on valid callback', async () => {
    paymentService.handleAlipayCallback.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/payment/callback/alipay/notify')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('out_trade_no=ORD001&trade_status=TRADE_SUCCESS&sign=sig');

    expect(res.status).toBe(200);
    expect(res.text).toBe('success');
  });

  it('returns "fail" on verification failure', async () => {
    paymentService.handleAlipayCallback.mockResolvedValue({ success: false, error: 'invalid_sig' });

    const res = await request(app)
      .post('/payment/callback/alipay/notify')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('out_trade_no=ORD001');

    expect(res.status).toBe(200);
    expect(res.text).toBe('fail');
  });

  it('returns "fail" on exception', async () => {
    paymentService.handleAlipayCallback.mockRejectedValue(new Error('db error'));

    const res = await request(app)
      .post('/payment/callback/alipay/notify')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('');

    expect(res.status).toBe(200);
    expect(res.text).toBe('fail');
  });
});
