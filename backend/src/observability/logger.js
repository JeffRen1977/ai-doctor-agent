/**
 * 结构化日志 —— 单一 logger 出口。
 *
 * 为什么必须是结构化（JSON）而不是 console.log：
 *   1. 医疗产品事后追责要能按 requestId / userId 精确检索，字符串日志做不到；
 *   2. 日志里绝不能出现病历原文、密码、token、API Key —— pino 的 redact 在序列化层
 *      统一抹掉，比依赖每个调用点自觉可靠得多。
 *
 * 所有日志自动附带当前请求上下文（requestId / userId），无需调用方手动传。
 */

const pino = require('pino');
const { getContext } = require('./requestContext');

/** 需要在日志中抹掉的字段路径。宁可多抹，泄露一次就是不可逆的。 */
const REDACT_PATHS = [
  // 凭据类
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  'apiKey',
  '*.apiKey',
  // 医疗内容类：审计表才是它们该去的地方，日志里只留摘要与摘要哈希
  'healthData',
  '*.healthData',
  'medicalHistory',
  '*.medicalHistory',
  'prompt',
  '*.prompt',
  'aiResponse',
  '*.aiResponse'
];

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  // 生产输出单行 JSON 交给日志平台；本地保持可读
  ...(isProduction ? {} : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } }),
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  base: {
    service: 'ai-doctor-agent',
    env: process.env.NODE_ENV || 'development',
    // 便于把一条日志定位到具体一次部署
    release: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || undefined
  },
  formatters: {
    level: (label) => ({ level: label })
  },
  // 每条日志自动混入当前请求上下文
  mixin() {
    const { requestId, userId, route } = getContext();
    return requestId ? { requestId, userId, route } : {};
  }
});

module.exports = logger;
module.exports.REDACT_PATHS = REDACT_PATHS;
