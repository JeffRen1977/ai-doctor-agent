/**
 * Authenticated payment routes: plans, orders, subscription status.
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

const createOrderSchema = Joi.object({
  planId: Joi.string().valid('monthly', 'quarterly', 'yearly').required(),
  paymentMethod: Joi.string().valid('wechat_pay', 'alipay').required(),
  openId: Joi.string().allow('').optional()
});

router.get('/plans', (req, res) => {
  res.json({ success: true, plans: paymentService.getPlans() });
});

router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.email || req.user.userId;
    const status = await paymentService.getSubscriptionStatus(userId);
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.email || req.user.userId;
    const orders = await paymentService.listUserOrders(userId);
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/orders', authenticateToken, async (req, res) => {
  try {
    const { error: valErr, value } = createOrderSchema.validate(req.body);
    if (valErr) {
      return res.status(400).json({ success: false, error: valErr.details[0].message });
    }

    const userId = req.user.email || req.user.userId;
    const result = await paymentService.createOrder({
      userId,
      userEmail: req.user.email,
      planId: value.planId,
      paymentMethod: value.paymentMethod,
      openId: value.openId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
