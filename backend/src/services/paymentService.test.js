const mockCreateOrder = jest.fn();
const mockGetOrderByOrderNo = jest.fn();
const mockUpdateOrderStatus = jest.fn();
const mockListOrdersByUser = jest.fn();
const mockGetActiveSubscription = jest.fn();
const mockCreateSubscription = jest.fn();

jest.mock('../repositories', () => ({
  orderRepo: {
    createOrder: mockCreateOrder,
    getOrderByOrderNo: mockGetOrderByOrderNo,
    updateOrderStatus: mockUpdateOrderStatus,
    listOrdersByUser: mockListOrdersByUser
  },
  subscriptionRepo: {
    getActiveSubscription: mockGetActiveSubscription,
    createSubscription: mockCreateSubscription
  }
}));

jest.mock('./wechatPayService', () => ({
  createUnifiedOrder: jest.fn(),
  generatePayParams: jest.fn().mockReturnValue({ appId: 'wx', timeStamp: '1', nonceStr: 'n', package: 'prepay_id=pp', signType: 'RSA', paySign: 'sig' }),
  verifyCallback: jest.fn(),
  isConfigured: jest.fn().mockReturnValue(true)
}));

jest.mock('./alipayService', () => ({
  createTradePagePay: jest.fn(),
  verifyCallback: jest.fn(),
  isConfigured: jest.fn().mockReturnValue(true)
}));

jest.mock('../observability/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn()
}));

const paymentService = require('./paymentService');
const wechatPayService = require('./wechatPayService');
const alipayService = require('./alipayService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPlans', () => {
  it('returns 3 plans', () => {
    const plans = paymentService.getPlans();
    expect(plans).toHaveLength(3);
    expect(plans.map(p => p.id)).toEqual(['monthly', 'quarterly', 'yearly']);
  });
});

describe('createOrder', () => {
  it('rejects invalid plan', async () => {
    const result = await paymentService.createOrder({
      userId: 'u1', userEmail: 'u@t.com', planId: 'invalid', paymentMethod: 'wechat_pay'
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid_plan');
  });

  it('rejects invalid payment method', async () => {
    const result = await paymentService.createOrder({
      userId: 'u1', userEmail: 'u@t.com', planId: 'monthly', paymentMethod: 'bitcoin'
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid_payment_method');
  });

  it('creates WeChat Pay order', async () => {
    mockCreateOrder.mockResolvedValue({ orderNo: 'ORD001' });
    wechatPayService.createUnifiedOrder.mockResolvedValue({ success: true, prepayId: 'pp123' });

    const result = await paymentService.createOrder({
      userId: 'u1', userEmail: 'u@t.com', planId: 'monthly', paymentMethod: 'wechat_pay', openId: 'oid'
    });

    expect(result.success).toBe(true);
    expect(result.orderNo).toBeDefined();
    expect(result.payData.appId).toBe('wx');
    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
  });

  it('creates Alipay order', async () => {
    mockCreateOrder.mockResolvedValue({ orderNo: 'ORD002' });
    alipayService.createTradePagePay.mockReturnValue({ success: true, payUrl: 'https://alipay.com/pay' });

    const result = await paymentService.createOrder({
      userId: 'u1', userEmail: 'u@t.com', planId: 'quarterly', paymentMethod: 'alipay'
    });

    expect(result.success).toBe(true);
    expect(result.payData.payUrl).toBe('https://alipay.com/pay');
  });

  it('handles WeChat Pay failure', async () => {
    mockCreateOrder.mockResolvedValue({ orderNo: 'ORD003' });
    wechatPayService.createUnifiedOrder.mockResolvedValue({ success: false, error: 'api_error' });
    mockUpdateOrderStatus.mockResolvedValue(undefined);

    const result = await paymentService.createOrder({
      userId: 'u1', userEmail: 'u@t.com', planId: 'monthly', paymentMethod: 'wechat_pay'
    });

    expect(result.success).toBe(false);
    expect(mockUpdateOrderStatus).toHaveBeenCalled();
  });
});

describe('activateSubscription', () => {
  it('returns error for missing order', async () => {
    mockGetOrderByOrderNo.mockResolvedValue(null);
    const result = await paymentService.activateSubscription('MISSING', 'T1');
    expect(result.success).toBe(false);
  });

  it('skips already-paid order', async () => {
    mockGetOrderByOrderNo.mockResolvedValue({ orderNo: 'ORD001', status: 'paid', planId: 'monthly' });
    const result = await paymentService.activateSubscription('ORD001', 'T1');
    expect(result.success).toBe(true);
    expect(result.message).toBe('already_processed');
  });

  it('activates subscription on paid order', async () => {
    mockGetOrderByOrderNo.mockResolvedValue({
      orderNo: 'ORD001', status: 'pending', planId: 'monthly', userId: 'u1', amount: 2900
    });
    mockUpdateOrderStatus.mockResolvedValue(true);
    mockCreateSubscription.mockResolvedValue({ subscriptionId: 'sub1' });

    const result = await paymentService.activateSubscription('ORD001', 'T123', 2900);
    expect(result.success).toBe(true);
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
      'ORD001',
      expect.objectContaining({ status: 'paid', tradeNo: 'T123' }),
      { condition: { status: { $ne: 'paid' } } }
    );
    expect(mockCreateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', planId: 'monthly', status: 'active' })
    );
  });

  it('returns already_processed when atomic update finds order already paid', async () => {
    mockGetOrderByOrderNo.mockResolvedValue({
      orderNo: 'ORD001', status: 'pending', planId: 'monthly', userId: 'u1', amount: 2900
    });
    mockUpdateOrderStatus.mockResolvedValue(false);

    const result = await paymentService.activateSubscription('ORD001', 'T123', 2900);
    expect(result.success).toBe(true);
    expect(result.message).toBe('already_processed');
    expect(mockCreateSubscription).not.toHaveBeenCalled();
  });

  it('rejects when paid amount does not match order amount', async () => {
    mockGetOrderByOrderNo.mockResolvedValue({
      orderNo: 'ORD001', status: 'pending', planId: 'monthly', userId: 'u1', amount: 2900
    });

    const result = await paymentService.activateSubscription('ORD001', 'T123', 100);
    expect(result.success).toBe(false);
    expect(result.error).toBe('amount_mismatch');
    expect(mockUpdateOrderStatus).not.toHaveBeenCalled();
    expect(mockCreateSubscription).not.toHaveBeenCalled();
  });
});

describe('handleWeChatPayCallback', () => {
  it('returns error on verification failure', async () => {
    wechatPayService.verifyCallback.mockReturnValue({ success: false, error: 'bad' });
    const result = await paymentService.handleWeChatPayCallback({}, '{}');
    expect(result.success).toBe(false);
  });

  it('activates on SUCCESS state with amount verification', async () => {
    wechatPayService.verifyCallback.mockReturnValue({
      success: true,
      data: { out_trade_no: 'ORD001', trade_state: 'SUCCESS', transaction_id: 'TX1', amount: { total: 2900 } }
    });
    mockGetOrderByOrderNo.mockResolvedValue({
      orderNo: 'ORD001', status: 'pending', planId: 'monthly', userId: 'u1', amount: 2900
    });
    mockUpdateOrderStatus.mockResolvedValue(true);
    mockCreateSubscription.mockResolvedValue({ subscriptionId: 'sub1' });

    const result = await paymentService.handleWeChatPayCallback({}, '{}');
    expect(result.success).toBe(true);
  });
});

describe('handleAlipayCallback', () => {
  it('returns error on verification failure', async () => {
    alipayService.verifyCallback.mockReturnValue({ success: false, error: 'invalid_signature' });
    const result = await paymentService.handleAlipayCallback({});
    expect(result.success).toBe(false);
  });

  it('activates on TRADE_SUCCESS with amount verification', async () => {
    alipayService.verifyCallback.mockReturnValue({
      success: true,
      data: { outTradeNo: 'ORD001', tradeNo: 'AT1', tradeStatus: 'TRADE_SUCCESS', totalAmount: '199.00' }
    });
    mockGetOrderByOrderNo.mockResolvedValue({
      orderNo: 'ORD001', status: 'pending', planId: 'yearly', userId: 'u1', amount: 19900
    });
    mockUpdateOrderStatus.mockResolvedValue(true);
    mockCreateSubscription.mockResolvedValue({ subscriptionId: 'sub2' });

    const result = await paymentService.handleAlipayCallback({});
    expect(result.success).toBe(true);
  });
});

describe('getSubscriptionStatus', () => {
  it('returns inactive when no subscription', async () => {
    mockGetActiveSubscription.mockResolvedValue(null);
    const status = await paymentService.getSubscriptionStatus('u1');
    expect(status.active).toBe(false);
  });

  it('returns active subscription', async () => {
    mockGetActiveSubscription.mockResolvedValue({
      subscriptionId: 'sub1', planId: 'monthly',
      startDate: '2026-10-01', endDate: '2026-10-31'
    });
    const status = await paymentService.getSubscriptionStatus('u1');
    expect(status.active).toBe(true);
    expect(status.plan.id).toBe('monthly');
  });
});

describe('checkAccess', () => {
  it('returns false without active subscription', async () => {
    mockGetActiveSubscription.mockResolvedValue(null);
    expect(await paymentService.checkAccess('u1')).toBe(false);
  });

  it('returns true with active subscription', async () => {
    mockGetActiveSubscription.mockResolvedValue({ subscriptionId: 'sub1', planId: 'monthly' });
    expect(await paymentService.checkAccess('u1')).toBe(true);
  });
});
