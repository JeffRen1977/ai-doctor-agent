/**
 * 短信验证码服务：阿里云短信 SDK 封装。
 * 生成、存储、验证 6 位数字验证码。
 */

const { smsCodeRepo } = require('../repositories');
const logger = require('../observability/logger');

const CODE_LENGTH = 6;
const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

let _smsClient = null;

function getSmsClient() {
  if (_smsClient) return _smsClient;

  const China20170525 = require('@alicloud/dysmsapi20170525').default;
  const OpenApi = require('@alicloud/openapi-client').default;

  const config = new OpenApi({
    accessKeyId: process.env.ALIBABA_SMS_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_SMS_ACCESS_KEY_SECRET,
    endpoint: `dysmsapi.aliyuncs.com`
  });

  _smsClient = new China20170525(config);
  return _smsClient;
}

function isSmsConfigured() {
  return !!(process.env.ALIBABA_SMS_ACCESS_KEY_ID && process.env.ALIBABA_SMS_ACCESS_KEY_SECRET);
}

/**
 * Send a verification code to the given phone number.
 * @param {string} phone - Chinese mobile number (e.g., 13812345678)
 * @returns {Promise<{success: boolean, expiresAt?: string, error?: string}>}
 */
async function sendVerificationCode(phone) {
  if (!phone) {
    return { success: false, error: '手机号不能为空' };
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
    return { success: false, error: '请输入有效的手机号' };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  await smsCodeRepo.putSmsCode(cleanPhone, { code, expiresAt });

  if (!isSmsConfigured()) {
    logger.warn({ phone: cleanPhone }, 'SMS credentials not configured; code stored but not sent');
    return { success: true, expiresAt, _devCode: process.env.NODE_ENV !== 'production' ? code : undefined };
  }

  try {
    const client = getSmsClient();
    const { default: RuntimeOptions } = require('@alicloud/tea-util');
    const { SendSmsRequest } = require('@alicloud/dysmsapi20170525');

    const request = new SendSmsRequest({
      phoneNumbers: cleanPhone,
      signName: process.env.ALIBABA_SMS_SIGN_NAME || 'AI医生',
      templateCode: process.env.ALIBABA_SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code })
    });

    const runtime = new RuntimeOptions({});
    await client.sendSmsWithOptions(request, runtime);

    return { success: true, expiresAt };
  } catch (error) {
    logger.error({ err: { message: error?.message }, phone: cleanPhone }, 'SMS send failed');
    return { success: false, error: '短信发送失败，请稍后重试' };
  }
}

/**
 * Verify a code submitted by the user.
 * @param {string} phone
 * @param {string} code
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function verifyCode(phone, code) {
  if (!phone || !code) {
    return { valid: false, error: '手机号和验证码不能为空' };
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const stored = await smsCodeRepo.getSmsCode(cleanPhone);

  if (!stored) {
    return { valid: false, error: '验证码已过期或不存在' };
  }

  if (stored.attempts >= MAX_ATTEMPTS) {
    await smsCodeRepo.deleteSmsCode(cleanPhone);
    return { valid: false, error: '验证码错误次数过多，请重新获取' };
  }

  if (stored.code !== String(code).trim()) {
    await smsCodeRepo.incrementAttempts(cleanPhone);
    return { valid: false, error: '验证码错误' };
  }

  await smsCodeRepo.deleteSmsCode(cleanPhone);
  return { valid: true };
}

module.exports = {
  sendVerificationCode,
  verifyCode,
  generateCode,
  isSmsConfigured
};
