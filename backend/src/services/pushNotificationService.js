const axios = require('axios');
const logger = require('../observability/logger');

const VENDOR_HUAWEI = 'huawei';
const VENDOR_XIAOMI = 'xiaomi';
const VENDOR_OPPO = 'oppo';
const VENDOR_VIVO = 'vivo';

let huaweiAccessToken = null;
let huaweiTokenExpiry = 0;

function getConfig(vendor) {
  switch (vendor) {
    case VENDOR_HUAWEI:
      return {
        appId: process.env.HUAWEI_APP_ID,
        appSecret: process.env.HUAWEI_APP_SECRET,
        configured: !!(process.env.HUAWEI_APP_ID && process.env.HUAWEI_APP_SECRET)
      };
    case VENDOR_XIAOMI:
      return {
        appSecret: process.env.XIAOMI_APP_SECRET,
        packageName: process.env.XIAOMI_PACKAGE_NAME || 'com.aidoctor.agent',
        configured: !!process.env.XIAOMI_APP_SECRET
      };
    case VENDOR_OPPO:
      return {
        appKey: process.env.OPPO_APP_KEY,
        appSecret: process.env.OPPO_APP_SECRET,
        configured: !!(process.env.OPPO_APP_KEY && process.env.OPPO_APP_SECRET)
      };
    case VENDOR_VIVO:
      return {
        appId: process.env.VIVO_APP_ID,
        appKey: process.env.VIVO_APP_KEY,
        appSecret: process.env.VIVO_APP_SECRET,
        configured: !!(process.env.VIVO_APP_ID && process.env.VIVO_APP_KEY && process.env.VIVO_APP_SECRET)
      };
    default:
      return { configured: false };
  }
}

function isConfigured(vendor) {
  return getConfig(vendor).configured;
}

async function getHuaweiAccessToken() {
  if (huaweiAccessToken && Date.now() < huaweiTokenExpiry) {
    return huaweiAccessToken;
  }
  const { appId, appSecret } = getConfig(VENDOR_HUAWEI);
  const res = await axios.post(
    'https://oauth-login.cloud.huawei.com/oauth2/v3/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: appId,
      client_secret: appSecret
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
  );
  huaweiAccessToken = res.data.access_token;
  huaweiTokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return huaweiAccessToken;
}

async function sendHuawei(deviceToken, notification) {
  const { appId } = getConfig(VENDOR_HUAWEI);
  const accessToken = await getHuaweiAccessToken();
  const payload = {
    message: {
      token: [deviceToken],
      notification: {
        title: notification.title,
        body: notification.body
      },
      android: {
        notification: {
          click_action: { type: 1 },
          channel_id: 'ai-doctor-health'
        }
      }
    }
  };
  const res = await axios.post(
    `https://push-api.cloud.huawei.com/v1/${appId}/messages:send`,
    payload,
    {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      timeout: 10000
    }
  );
  return { vendor: VENDOR_HUAWEI, success: true, response: res.data };
}

async function sendXiaomi(deviceToken, notification) {
  const { appSecret, packageName } = getConfig(VENDOR_XIAOMI);
  const params = new URLSearchParams({
    registration_id: deviceToken,
    title: notification.title,
    description: notification.body,
    restricted_package_name: packageName,
    notify_type: '-1',
    pass_through: '0'
  });
  const res = await axios.post(
    'https://api.xmpush.xiaomi.com/v3/message/regid',
    params.toString(),
    {
      headers: {
        Authorization: `key=${appSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    }
  );
  return { vendor: VENDOR_XIAOMI, success: true, response: res.data };
}

async function sendOppo(deviceToken, notification) {
  const { appKey, appSecret } = getConfig(VENDOR_OPPO);
  const crypto = require('crypto');
  const timestamp = String(Date.now());
  const sign = crypto.createHash('sha256')
    .update(`${appKey}${timestamp}${appSecret}`)
    .digest('hex');

  const authRes = await axios.post(
    'https://api.push.oppomobile.com/server/v1/auth',
    new URLSearchParams({ app_key: appKey, sign, timestamp }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
  );
  const authToken = authRes.data?.data?.auth_token;
  if (!authToken) {
    return { vendor: VENDOR_OPPO, success: false, error: 'auth_failed', response: authRes.data };
  }

  const res = await axios.post(
    'https://api.push.oppomobile.com/server/v1/message/notification/unicast',
    {
      target_type: 2,
      target_value: deviceToken,
      notification: {
        title: notification.title,
        content: notification.body,
        click_action_type: 1
      }
    },
    {
      headers: { auth_token: authToken, 'Content-Type': 'application/json' },
      timeout: 10000
    }
  );
  return { vendor: VENDOR_OPPO, success: true, response: res.data };
}

async function sendToDevice(deviceToken, vendor, notification) {
  const config = getConfig(vendor);
  if (!config.configured) {
    return { vendor, success: false, reason: 'vendor_not_configured' };
  }

  switch (vendor) {
    case VENDOR_HUAWEI: return sendHuawei(deviceToken, notification);
    case VENDOR_XIAOMI: return sendXiaomi(deviceToken, notification);
    case VENDOR_OPPO: return sendOppo(deviceToken, notification);
    default:
      return { vendor, success: false, reason: 'unsupported_vendor' };
  }
}

async function sendPush(userId, notification) {
  let deviceTokenRepo;
  try {
    deviceTokenRepo = require('../repositories').deviceTokenRepo;
  } catch {
    return { success: false, error: 'device_token_repo_unavailable' };
  }

  const devices = await deviceTokenRepo.getDevicesByUserId(userId);
  if (!devices || devices.length === 0) {
    return { success: false, reason: 'no_registered_devices' };
  }

  const results = [];
  for (const device of devices) {
    try {
      const result = await sendToDevice(device.token, device.vendor, notification);
      results.push(result);
    } catch (err) {
      logger.error({ err: { message: err.message }, vendor: device.vendor }, 'push notification failed');
      results.push({ vendor: device.vendor, success: false, error: err.message });
    }
  }

  return {
    success: results.some(r => r.success),
    sent: results.filter(r => r.success).length,
    total: results.length,
    results
  };
}

function detectVendor(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return 'unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('huawei') || ua.includes('honor') || ua.includes('harmonyos')) return VENDOR_HUAWEI;
  if (ua.includes('xiaomi') || ua.includes('redmi') || ua.includes('poco') || ua.includes('miui')) return VENDOR_XIAOMI;
  if (ua.includes('oppo') || ua.includes('coloros') || ua.includes('realme')) return VENDOR_OPPO;
  if (ua.includes('vivo') || ua.includes('originos') || ua.includes('iqoo')) return VENDOR_VIVO;
  return 'unknown';
}

module.exports = {
  sendPush,
  sendToDevice,
  isConfigured,
  getConfig,
  detectVendor,
  VENDOR_HUAWEI,
  VENDOR_XIAOMI,
  VENDOR_OPPO,
  VENDOR_VIVO
};
