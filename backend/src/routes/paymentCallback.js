/**
 * Unauthenticated payment callback routes (no JWT).
 * POST /wechat/notify — WeChat Pay async notification
 * POST /alipay/notify — Alipay async notification
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const logger = require('../observability/logger');

router.post('/wechat/notify', express.json(), async (req, res) => {
  try {
    const result = await paymentService.handleWeChatPayCallback(req.headers, JSON.stringify(req.body));
    if (result.success) {
      return res.json({ code: 'SUCCESS', message: '' });
    }
    logger.error({ error: result.error }, 'WeChat Pay callback rejected');
    return res.status(400).json({ code: 'FAIL', message: result.error });
  } catch (error) {
    logger.error({ err: { message: error.message } }, 'WeChat Pay callback error');
    return res.status(500).json({ code: 'FAIL', message: 'INTERNAL_ERROR' });
  }
});

router.post('/alipay/notify', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const result = await paymentService.handleAlipayCallback(req.body);
    if (result.success) {
      return res.send('success');
    }
    logger.error({ error: result.error }, 'Alipay callback rejected');
    return res.send('fail');
  } catch (error) {
    logger.error({ err: { message: error.message } }, 'Alipay callback error');
    return res.send('fail');
  }
});

module.exports = router;
