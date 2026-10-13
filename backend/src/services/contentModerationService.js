const logger = require('../observability/logger');

let GreenClient = null;
let TextModerationRequest = null;
let OpenApiModels = null;
let TeaUtil = null;

try {
  const green = require('@alicloud/green20220302');
  GreenClient = green.default;
  TextModerationRequest = green.TextModerationRequest;
  OpenApiModels = require('@alicloud/openapi-client');
  TeaUtil = require('@alicloud/tea-util');
} catch {
  // Package not installed — moderation will be unavailable
}

const MODERATION_LABELS_BLOCK = [
  'spam', 'politics', 'abuse', 'terrorism', 'porn', 'contraband', 'ad'
];

let clientInstance = null;

function getConfig() {
  return {
    accessKeyId: process.env.ALIBABA_GREEN_ACCESS_KEY_ID || process.env.ALIBABA_SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIBABA_GREEN_ACCESS_KEY_SECRET || process.env.ALIBABA_SMS_ACCESS_KEY_SECRET || '',
    region: process.env.ALIBABA_GREEN_REGION || 'cn-shanghai',
    endpoint: process.env.ALIBABA_GREEN_ENDPOINT || 'green-cip.cn-shanghai.aliyuncs.com'
  };
}

function isConfigured() {
  if (!GreenClient) return false;
  const c = getConfig();
  return !!(c.accessKeyId && c.accessKeySecret);
}

function getClient() {
  if (clientInstance) return clientInstance;
  if (!isConfigured()) return null;

  const c = getConfig();
  const config = new OpenApiModels.Config({
    accessKeyId: c.accessKeyId,
    accessKeySecret: c.accessKeySecret,
    regionId: c.region,
    endpoint: c.endpoint
  });
  clientInstance = new GreenClient(config);
  return clientInstance;
}

async function moderateText(text) {
  if (!text || typeof text !== 'string') {
    return { safe: true, labels: [], reason: 'empty_input' };
  }

  if (!isConfigured()) {
    return { safe: true, labels: [], reason: 'moderation_not_configured' };
  }

  const client = getClient();
  if (!client) {
    return { safe: true, labels: [], reason: 'client_init_failed' };
  }

  try {
    const serviceParameters = JSON.stringify({
      content: text.slice(0, 10000)
    });

    const request = new TextModerationRequest({
      service: 'chat_detection',
      serviceParameters
    });

    const runtime = new TeaUtil.RuntimeOptions({});
    const response = await client.textModerationWithOptions(request, runtime);

    const body = response?.body;
    if (!body || body.code !== 200) {
      logger.warn({ code: body?.code, msg: body?.message }, 'content moderation API error');
      return { safe: true, labels: [], reason: 'api_error' };
    }

    const data = body.data;
    if (!data) {
      return { safe: true, labels: [], reason: 'no_data' };
    }

    const labels = [];
    if (data.labels) {
      const labelStr = typeof data.labels === 'string' ? data.labels : '';
      labelStr.split(',').forEach(l => {
        const trimmed = l.trim();
        if (trimmed) labels.push(trimmed);
      });
    }

    const safe = !shouldBlock({ labels });
    return { safe, labels, reason: data.reason || null };
  } catch (err) {
    logger.error({ err: { message: err.message } }, 'content moderation call failed');
    return { safe: true, labels: [], reason: 'exception' };
  }
}

async function moderateHealthContent(text) {
  const result = await moderateText(text);
  if (!result.safe) {
    result.healthWarning = '内容包含不适当信息，已被系统过滤。';
  }
  return result;
}

function shouldBlock(moderationResult) {
  if (!moderationResult || !moderationResult.labels) return false;
  return moderationResult.labels.some(l => MODERATION_LABELS_BLOCK.includes(l));
}

module.exports = {
  isConfigured,
  moderateText,
  moderateHealthContent,
  shouldBlock,
  MODERATION_LABELS_BLOCK
};
