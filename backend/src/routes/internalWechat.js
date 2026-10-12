/**
 * WeChat OA webhook (no JWT).
 * GET  /webhook — echostr verification (one-time setup)
 * POST /webhook — XML messages → binding flow
 */

const express = require('express');
const router = express.Router();
const wechatIntegrationService = require('../services/wechatIntegrationService');
const logger = require('../observability/logger');

/**
 * WeChat sends raw XML; parse it with xml2js (lazy-loaded so tests can mock).
 */
async function parseXml(xmlStr) {
  const { parseStringPromise } = require('xml2js');
  const result = await parseStringPromise(xmlStr, { explicitArray: false, trim: true });
  return result.xml || result;
}

/**
 * GET /internal/wechat/webhook
 * WeChat server verification: return echostr if signature is valid.
 */
router.get('/webhook', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  if (!signature || !timestamp || !nonce || !echostr) {
    return res.status(400).send('Missing parameters');
  }

  if (wechatIntegrationService.verifySignature(signature, timestamp, nonce)) {
    return res.send(echostr);
  }

  return res.status(403).send('Invalid signature');
});

/**
 * POST /internal/wechat/webhook
 * Incoming messages from WeChat users.
 */
router.post('/webhook', express.text({ type: ['text/xml', 'application/xml'] }), async (req, res) => {
  const { signature, timestamp, nonce } = req.query;

  if (signature && !wechatIntegrationService.verifySignature(signature, timestamp, nonce)) {
    return res.status(403).send('Invalid signature');
  }

  let openId = null;
  try {
    const xml = await parseXml(req.body);
    openId = xml.FromUserName;
    const msgType = xml.MsgType;
    const content = xml.Content || '';

    if (msgType !== 'text' || !openId) {
      return res.send('success');
    }

    const bind = await wechatIntegrationService.bindWeChatUser(openId, content);

    if (bind.ok) {
      await wechatIntegrationService
        .sendTextMessage(openId, '绑定成功！您的微信已关联健康档案，将收到每日健康报告和用药提醒。')
        .catch((err) => logger.error({ err: { message: err?.message } }, 'wechat webhook send (success)'));
    } else if (String(content).trim()) {
      await wechatIntegrationService
        .sendTextMessage(openId, '请先在 App 内获取 6 位绑定码，再将绑定码发送给我。如已过期请重新获取。')
        .catch((err) => logger.error({ err: { message: err?.message } }, 'wechat webhook send (hint)'));
    }

    return res.send('success');
  } catch (error) {
    logger.error({ err: { message: error?.message } }, 'wechat webhook error');
    if (openId) {
      await wechatIntegrationService
        .sendTextMessage(openId, '处理消息时出错，请稍后重试。')
        .catch(() => {});
    }
    return res.send('success');
  }
});

module.exports = router;
