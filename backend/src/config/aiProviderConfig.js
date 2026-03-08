/**
 * AI 提供商配置层
 * 用于根据部署地域/环境变量解析默认 provider 与 model，并与用户设置合并。
 * 见 docs/AI_PROVIDER_SWITCH_DESIGN.md 阶段 1。
 */

const DEPLOYMENT_REGION = process.env.DEPLOYMENT_REGION || '';
const DEFAULT_AI_PROVIDER_ENV = process.env.DEFAULT_AI_PROVIDER || '';
const DEFAULT_AI_MODEL_ENV = process.env.DEFAULT_AI_MODEL || '';

/** 各 provider 的默认模型（未配置 DEFAULT_AI_MODEL 时使用） */
const DEFAULT_MODEL_BY_PROVIDER = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o',
  ernie: 'ernie-bot',
  qwen: 'qwen-turbo',
  zhipu: 'glm-4-flash'
};

/** 中国区默认 provider（当 DEPLOYMENT_REGION=cn 且未设置 DEFAULT_AI_PROVIDER 时） */
const CN_DEFAULT_PROVIDER = 'qwen';
/** 海外/未指定地域时的默认 provider */
const OVERSEAS_DEFAULT_PROVIDER = 'gemini';

/**
 * 根据 DEPLOYMENT_REGION 与 DEFAULT_AI_PROVIDER 返回默认 provider。
 * @returns {string}
 */
function getDefaultProvider() {
  if (DEFAULT_AI_PROVIDER_ENV) {
    return DEFAULT_AI_PROVIDER_ENV;
  }
  if (DEPLOYMENT_REGION === 'cn') {
    return CN_DEFAULT_PROVIDER;
  }
  return OVERSEAS_DEFAULT_PROVIDER;
}

/**
 * 返回指定 provider 的默认模型；若设置了 DEFAULT_AI_MODEL 则优先返回该值（对所有 provider 生效）。
 * @param {string} provider
 * @returns {string}
 */
function getDefaultModel(provider) {
  if (DEFAULT_AI_MODEL_ENV) {
    return DEFAULT_AI_MODEL_ENV;
  }
  return DEFAULT_MODEL_BY_PROVIDER[provider] || '';
}

/**
 * 解析最终使用的 AI 配置：用户设置 > 部署默认 > 兜底。
 * @param {Object} [userSettings] 用户 AI 设置，如 { success, aiProvider, aiModel }
 * @returns {{ provider: string, model: string }}
 */
function resolveAIConfig(userSettings) {
  const deploymentProvider = getDefaultProvider();
  const deploymentModel = getDefaultModel(deploymentProvider);

  if (userSettings && userSettings.success && userSettings.aiProvider) {
    const provider = userSettings.aiProvider;
    const model = userSettings.aiModel != null && userSettings.aiModel !== ''
      ? userSettings.aiModel
      : getDefaultModel(provider);
    return { provider, model };
  }

  return {
    provider: deploymentProvider,
    model: deploymentModel
  };
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
  CN_DEFAULT_PROVIDER,
  OVERSEAS_DEFAULT_PROVIDER
};
