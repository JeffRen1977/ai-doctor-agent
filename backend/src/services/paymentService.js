/**
 * Payment orchestration — order lifecycle, subscription management.
 *
 * Plans (amounts in fen/分):
 *   monthly   ¥29   = 2900
 *   quarterly ¥69   = 6900
 *   yearly    ¥199  = 19900
 */

const crypto = require('crypto');
const { orderRepo, subscriptionRepo } = require('../repositories');
const wechatPayService = require('./wechatPayService');
const alipayService = require('./alipayService');
const logger = require('../observability/logger');

const PLANS = {
  monthly:   { id: 'monthly',   nameZh: '月度会员', nameEn: 'Monthly',   amount: 2900,  durationDays: 30 },
  quarterly: { id: 'quarterly', nameZh: '季度会员', nameEn: 'Quarterly', amount: 6900,  durationDays: 90 },
  yearly:    { id: 'yearly',    nameZh: '年度会员', nameEn: 'Annual',    amount: 19900, durationDays: 365 }
};

const ORDER_EXPIRY_MS = 30 * 60 * 1000;

function generateOrderNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD${ts}${rand}`;
}

function getPlans() {
  return Object.values(PLANS);
}

function getPlan(planId) {
  return PLANS[planId] || null;
}

/**
 * Create a payment order.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.userEmail
 * @param {string} params.planId  'monthly' | 'quarterly' | 'yearly'
 * @param {string} params.paymentMethod  'wechat_pay' | 'alipay'
 * @param {string} [params.openId]  required for WeChat JSAPI
 * @param {string} [params.tradeType]  'JSAPI' | 'H5', default 'JSAPI'
 * @param {string} [params.clientIp]  required for WeChat H5
 */
async function createOrder({ userId, userEmail, planId, paymentMethod, openId, tradeType, clientIp }) {
  const plan = getPlan(planId);
  if (!plan) {
    return { success: false, error: 'invalid_plan' };
  }

  if (!['wechat_pay', 'alipay'].includes(paymentMethod)) {
    return { success: false, error: 'invalid_payment_method' };
  }

  const orderNo = generateOrderNo();
  const expiresAt = new Date(Date.now() + ORDER_EXPIRY_MS).toISOString();

  const order = await orderRepo.createOrder({
    orderNo,
    userId,
    userEmail,
    planId,
    amount: plan.amount,
    currency: 'CNY',
    paymentMethod,
    status: 'pending',
    expiresAt,
    createdAt: new Date().toISOString()
  });

  let payData = null;

  if (paymentMethod === 'wechat_pay') {
    const wechatTradeType = tradeType || (openId ? 'JSAPI' : 'H5');
    const result = await wechatPayService.createUnifiedOrder({
      orderNo,
      amount: plan.amount,
      description: plan.nameZh,
      openId,
      tradeType: wechatTradeType,
      clientIp
    });
    if (!result.success) {
      await orderRepo.updateOrderStatus(orderNo, { status: 'failed', failReason: result.error });
      return { success: false, error: result.error };
    }
    payData = result.h5Url
      ? { h5Url: result.h5Url }
      : wechatPayService.generatePayParams(result.prepayId);
  } else {
    const result = alipayService.createTradePagePay({
      orderNo,
      amount: plan.amount,
      subject: plan.nameZh
    });
    if (!result.success) {
      await orderRepo.updateOrderStatus(orderNo, { status: 'failed', failReason: result.error });
      return { success: false, error: result.error };
    }
    payData = { payUrl: result.payUrl };
  }

  return { success: true, orderNo, payData };
}

/**
 * Handle successful payment — activate subscription.
 * @param {string} orderNo
 * @param {string} tradeNo  platform transaction id
 * @param {number} paidAmountFen  actual amount paid (fen), verified against order
 */
async function activateSubscription(orderNo, tradeNo, paidAmountFen) {
  const order = await orderRepo.getOrderByOrderNo(orderNo);
  if (!order) {
    logger.error({ orderNo }, 'activateSubscription: order not found');
    return { success: false, error: 'order_not_found' };
  }

  const plan = getPlan(order.planId);
  if (!plan) {
    return { success: false, error: 'invalid_plan' };
  }

  if (paidAmountFen === undefined || paidAmountFen === null) {
    logger.error({ orderNo }, 'activateSubscription: missing paid amount');
    return { success: false, error: 'missing_paid_amount' };
  }

  if (paidAmountFen !== order.amount) {
    logger.error({ orderNo, expected: order.amount, actual: paidAmountFen }, 'activateSubscription: amount mismatch');
    return { success: false, error: 'amount_mismatch' };
  }

  // Atomic: only the first callback to flip status creates the subscription.
  // If order is already paid, check whether subscription exists (it may have
  // failed on a previous attempt) and retry if missing.
  const updated = await orderRepo.updateOrderStatus(orderNo, {
    status: 'paid',
    tradeNo,
    paidAt: new Date().toISOString()
  }, { condition: { status: { $ne: 'paid' } } });

  if (!updated) {
    const existing = await subscriptionRepo.getSubscriptionByOrderNo(orderNo);
    if (existing) {
      return { success: true, message: 'already_processed' };
    }
    // Order is paid but subscription is missing — fall through to create it.
  }

  const now = new Date();
  const existingSub = await subscriptionRepo.getActiveSubscription(order.userId);
  const baseDate = existingSub && new Date(existingSub.endDate) > now
    ? new Date(existingSub.endDate)
    : now;
  const endDate = new Date(baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  await subscriptionRepo.createSubscription({
    userId: order.userId,
    planId: order.planId,
    status: 'active',
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    orderNo
  });

  return { success: true };
}

async function handleWeChatPayCallback(headers, body) {
  const result = wechatPayService.verifyCallback(headers, body);
  if (!result.success) {
    return result;
  }

  const { out_trade_no, trade_state, transaction_id, amount } = result.data;
  if (trade_state !== 'SUCCESS') {
    return { success: true, message: 'non_success_state' };
  }

  const paidFen = amount?.total;
  return activateSubscription(out_trade_no, transaction_id, paidFen);
}

async function handleAlipayCallback(params) {
  const result = alipayService.verifyCallback(params);
  if (!result.success) {
    return result;
  }

  if (result.data.tradeStatus !== 'TRADE_SUCCESS' && result.data.tradeStatus !== 'TRADE_FINISHED') {
    return { success: true, message: 'non_success_state' };
  }

  const paidFen = result.data.totalAmount ? Math.round(parseFloat(result.data.totalAmount) * 100) : undefined;
  return activateSubscription(result.data.outTradeNo, result.data.tradeNo, paidFen);
}

async function getSubscriptionStatus(userId) {
  const sub = await subscriptionRepo.getActiveSubscription(userId);
  if (!sub) {
    return { active: false, plan: null };
  }
  const plan = getPlan(sub.planId);
  return {
    active: true,
    plan: plan || { id: sub.planId },
    startDate: sub.startDate,
    endDate: sub.endDate,
    subscriptionId: sub.subscriptionId
  };
}

async function checkAccess(userId) {
  const status = await getSubscriptionStatus(userId);
  return status.active;
}

async function listUserOrders(userId, options) {
  return orderRepo.listOrdersByUser(userId, options);
}

module.exports = {
  createOrder,
  handleWeChatPayCallback,
  handleAlipayCallback,
  getSubscriptionStatus,
  checkAccess,
  listUserOrders,
  getPlans,
  getPlan,
  activateSubscription,
  generateOrderNo
};
