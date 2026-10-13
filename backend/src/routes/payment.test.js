jest.mock('../services/paymentService');
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { email: 'test@example.com', userId: 'uid1' };
    next();
  }
}));

process.env.RATE_LIMIT_DISABLED = 'true';

const express = require('express');
const request = require('supertest');
const paymentRoutes = require('./payment');
const paymentService = require('../services/paymentService');

const app = express();
app.use(express.json());
app.use('/api/payment', paymentRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/payment/plans', () => {
  it('returns plans', async () => {
    paymentService.getPlans.mockReturnValue([
      { id: 'monthly', amount: 2900 },
      { id: 'quarterly', amount: 6900 },
      { id: 'yearly', amount: 19900 }
    ]);

    const res = await request(app).get('/api/payment/plans');
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(3);
  });
});

describe('GET /api/payment/subscription', () => {
  it('returns subscription status', async () => {
    paymentService.getSubscriptionStatus.mockResolvedValue({ active: false, plan: null });
    const res = await request(app).get('/api/payment/subscription');
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });
});

describe('GET /api/payment/orders', () => {
  it('returns user orders', async () => {
    paymentService.listUserOrders.mockResolvedValue([{ orderNo: 'ORD001' }]);
    const res = await request(app).get('/api/payment/orders');
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
  });
});

describe('POST /api/payment/orders', () => {
  it('validates required fields', async () => {
    const res = await request(app).post('/api/payment/orders').send({});
    expect(res.status).toBe(400);
  });

  it('rejects invalid plan', async () => {
    const res = await request(app).post('/api/payment/orders').send({
      planId: 'invalid', paymentMethod: 'wechat_pay'
    });
    expect(res.status).toBe(400);
  });

  it('creates order with wechat_pay', async () => {
    paymentService.createOrder.mockResolvedValue({
      success: true, orderNo: 'ORD001', payData: { appId: 'wx' }
    });

    const res = await request(app).post('/api/payment/orders').send({
      planId: 'monthly', paymentMethod: 'wechat_pay'
    });

    expect(res.status).toBe(201);
    expect(res.body.orderNo).toBe('ORD001');
    expect(paymentService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ planId: 'monthly', paymentMethod: 'wechat_pay', userId: 'test@example.com' })
    );
  });

  it('creates order with alipay', async () => {
    paymentService.createOrder.mockResolvedValue({
      success: true, orderNo: 'ORD002', payData: { payUrl: 'https://alipay.com' }
    });

    const res = await request(app).post('/api/payment/orders').send({
      planId: 'yearly', paymentMethod: 'alipay'
    });

    expect(res.status).toBe(201);
    expect(res.body.payData.payUrl).toBe('https://alipay.com');
  });

  it('returns 400 on service failure', async () => {
    paymentService.createOrder.mockResolvedValue({ success: false, error: 'api_error' });

    const res = await request(app).post('/api/payment/orders').send({
      planId: 'monthly', paymentMethod: 'wechat_pay'
    });

    expect(res.status).toBe(400);
  });
});
