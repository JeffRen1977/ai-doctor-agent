const crypto = require('crypto');

jest.mock('../services/wechatIntegrationService');
jest.mock('../observability/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

// Mock xml2js at the module level
jest.mock('xml2js', () => ({
  parseStringPromise: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const internalWechatRoutes = require('./internalWechat');
const wechatService = require('../services/wechatIntegrationService');
const { parseStringPromise } = require('xml2js');

const app = express();
app.use('/internal/wechat', internalWechatRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

function makeSignature(token, timestamp, nonce) {
  const arr = [token, timestamp, nonce].sort();
  return crypto.createHash('sha1').update(arr.join('')).digest('hex');
}

describe('GET /internal/wechat/webhook', () => {
  it('returns 400 when params are missing', async () => {
    const res = await request(app).get('/internal/wechat/webhook');
    expect(res.status).toBe(400);
  });

  it('returns echostr when signature is valid', async () => {
    wechatService.verifySignature.mockReturnValue(true);

    const res = await request(app)
      .get('/internal/wechat/webhook')
      .query({ signature: 'abc', timestamp: '123', nonce: 'nonce', echostr: 'hello_wechat' });

    expect(res.status).toBe(200);
    expect(res.text).toBe('hello_wechat');
    expect(wechatService.verifySignature).toHaveBeenCalledWith('abc', '123', 'nonce');
  });

  it('returns 403 when signature is invalid', async () => {
    wechatService.verifySignature.mockReturnValue(false);

    const res = await request(app)
      .get('/internal/wechat/webhook')
      .query({ signature: 'bad', timestamp: '123', nonce: 'nonce', echostr: 'hello' });

    expect(res.status).toBe(403);
  });
});

describe('POST /internal/wechat/webhook', () => {
  const textMessageXml = `<xml>
    <ToUserName><![CDATA[gh_test]]></ToUserName>
    <FromUserName><![CDATA[openid123]]></FromUserName>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[ABCDEF]]></Content>
  </xml>`;

  beforeEach(() => {
    wechatService.verifySignature.mockReturnValue(true);
    wechatService.sendTextMessage.mockResolvedValue({ sent: true });
  });

  it('binds user on valid code', async () => {
    parseStringPromise.mockResolvedValue({
      xml: { FromUserName: 'openid123', MsgType: 'text', Content: 'ABCDEF' }
    });
    wechatService.bindWeChatUser.mockResolvedValue({ ok: true, userId: 'user1' });

    const res = await request(app)
      .post('/internal/wechat/webhook')
      .query({ signature: 'sig', timestamp: '123', nonce: 'n' })
      .set('Content-Type', 'text/xml')
      .send(textMessageXml);

    expect(res.status).toBe(200);
    expect(res.text).toBe('success');
    expect(wechatService.bindWeChatUser).toHaveBeenCalledWith('openid123', 'ABCDEF');
    expect(wechatService.sendTextMessage).toHaveBeenCalledWith(
      'openid123',
      expect.stringContaining('绑定成功')
    );
  });

  it('sends hint on invalid code', async () => {
    parseStringPromise.mockResolvedValue({
      xml: { FromUserName: 'openid123', MsgType: 'text', Content: 'BADCODE' }
    });
    wechatService.bindWeChatUser.mockResolvedValue({ ok: false, reason: 'invalid_or_expired_code' });

    const res = await request(app)
      .post('/internal/wechat/webhook')
      .query({ signature: 'sig', timestamp: '123', nonce: 'n' })
      .set('Content-Type', 'text/xml')
      .send(textMessageXml);

    expect(res.status).toBe(200);
    expect(wechatService.sendTextMessage).toHaveBeenCalledWith(
      'openid123',
      expect.stringContaining('绑定码')
    );
  });

  it('ignores non-text messages', async () => {
    parseStringPromise.mockResolvedValue({
      xml: { FromUserName: 'openid123', MsgType: 'image' }
    });

    const res = await request(app)
      .post('/internal/wechat/webhook')
      .query({ signature: 'sig', timestamp: '123', nonce: 'n' })
      .set('Content-Type', 'text/xml')
      .send('<xml><MsgType>image</MsgType></xml>');

    expect(res.status).toBe(200);
    expect(wechatService.bindWeChatUser).not.toHaveBeenCalled();
  });

  it('returns 403 on invalid POST signature', async () => {
    wechatService.verifySignature.mockReturnValue(false);
    parseStringPromise.mockResolvedValue({ xml: {} });

    const res = await request(app)
      .post('/internal/wechat/webhook')
      .query({ signature: 'bad', timestamp: '123', nonce: 'n' })
      .set('Content-Type', 'text/xml')
      .send('<xml></xml>');

    expect(res.status).toBe(403);
  });
});
