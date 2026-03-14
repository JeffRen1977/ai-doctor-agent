/**
 * AI 提供商配置层
 * 用于根据部署地域/环境变量解析默认 provider 与 model，并与用户设置合并。
 * 见 docs/AI_PROVIDER_SWITCH_DESIGN.md 阶段 1。
 */

/** 各 provider 的默认模型（未配置 DEFAULT_AI_MODEL 时使用） */
const DEFAULT_MODEL_BY_PROVIDER = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o',
  ernie: 'ernie-bot',
  qwen: 'qwen-turbo',
  zhipu: 'glm-4-flash'
};

/** 中国区/国际区（新加坡等）默认用千问时使用的 provider */
const QWEN_DEFAULT_PROVIDER = 'qwen';
/** 海外/美国等未指定地域时的默认 provider（美国优先 OpenAI） */
const OVERSEAS_DEFAULT_PROVIDER = 'openai';

/** DEPLOYMENT_REGION 为这些值时默认使用千问（cn=中国灵积，intl=新加坡/Model Studio 等） */
const QWEN_DEFAULT_REGIONS = ['cn', 'intl'];

/**
 * 根据 DEPLOYMENT_REGION 与 DEFAULT_AI_PROVIDER 返回默认 provider。
 * 中国区/国际区（cn / intl）默认使用千问；DEFAULT_AI_PROVIDER 可显式覆盖为 openai/gemini 等。
 * @returns {string}
 */
function getDefaultProvider() {
  const region = (process.env.DEPLOYMENT_REGION || '').toLowerCase();
  const envProvider = (process.env.DEFAULT_AI_PROVIDER || '').trim();
  if (envProvider) {
    return envProvider;
  }
  if (QWEN_DEFAULT_REGIONS.includes(region)) {
    return QWEN_DEFAULT_PROVIDER;
  }
  return OVERSEAS_DEFAULT_PROVIDER;
}

/**
 * 返回指定 provider 的默认模型；若设置了 DEFAULT_AI_MODEL 则优先返回该值（对所有 provider 生效）。
 * @param {string} provider
 * @returns {string}
 */
function getDefaultModel(provider) {
  const envModel = process.env.DEFAULT_AI_MODEL || '';
  if (envModel) {
    return envModel;
  }
  return DEFAULT_MODEL_BY_PROVIDER[provider] || '';
}

/**
 * 解析最终使用的 AI 配置：仅由 .env 决定，不使用用户端保存的 AI 设置。
 * 通过 DEPLOYMENT_REGION、DEFAULT_AI_PROVIDER、DEFAULT_AI_MODEL 控制。
 * @param {Object} [userSettings] 保留参数以兼容调用方，不参与 provider/model 解析
 * @returns {{ provider: string, model: string }}
 */
function resolveAIConfig(userSettings) {
  const provider = getDefaultProvider();
  const model = getDefaultModel(provider);
  return { provider, model };
}

/**
 * 返回与业务层兼容的 AI 配置（aiProvider / aiModel），供各 service 替换本地 getAIServiceConfig。
 * @param {Object} [userSettings] 用户 AI 设置
 * @returns {{ aiProvider: string, aiModel: string }}
 */
function getAIServiceConfig(userSettings) {
  const { provider, model } = resolveAIConfig(userSettings);
  return { aiProvider: provider, aiModel: model };
}

module.exports = {
  getDefaultProvider,
  getDefaultModel,
  resolveAIConfig,
  getAIServiceConfig,
  DEFAULT_MODEL_BY_PROVIDER,
  CN_DEFAULT_PROVIDER: QWEN_DEFAULT_PROVIDER,
  QWEN_DEFAULT_PROVIDER,
  QWEN_DEFAULT_REGIONS,
  OVERSEAS_DEFAULT_PROVIDER
};
