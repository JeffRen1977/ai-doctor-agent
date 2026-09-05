/**
 * 错误上报 —— 一个出口，两个去向。
 *
 * 去向一（永远生效）：结构化错误日志，带 requestId、指纹和完整堆栈。
 * 去向二（可选）：Sentry。用惰性 require 而非硬依赖，因为国内部署可能用
 *   自建 Sentry 或阿里云 ARMS，不该在代码里锁死一家 SaaS。
 *   装了 @sentry/node 且配置 SENTRY_DSN 才启用，否则静默跳过。
 *
 * 指纹（fingerprint）的作用：即使没有 Sentry，也能在纯日志平台里
 * 按 fingerprint 聚合「同一个错误发生了多少次」，这是止血的第一手信息。
 */

const crypto = require('node:crypto');
const logger = require('./logger');
const { getContext } = require('./requestContext');

let sentry = null;
let sentryInitAttempted = false;

/** 惰性初始化 Sentry；未安装或未配置 DSN 时返回 null 并只提示一次 */
function getSentry() {
  if (sentryInitAttempted) return sentry;
  sentryInitAttempted = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  try {
    // eslint-disable-next-line global-require
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.RAILWAY_GIT_COMMIT_SHA || undefined,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
      // 不要把病历内容发给第三方
      sendDefaultPii: false
    });
    sentry = Sentry;
    logger.info('Sentry error reporting enabled');
  } catch {
    logger.warn('SENTRY_DSN 已配置但 @sentry/node 未安装，错误只会写入日志。执行 `npm i @sentry/node` 启用上报。');
    sentry = null;
  }
  return sentry;
}

/**
 * 用「错误类型 + 堆栈首帧」生成稳定指纹，同一处代码的同类错误聚成一组。
 * @param {Error} error
 * @returns {string}
 */
function fingerprintOf(error) {
  const name = error?.name || 'Error';
  const firstFrame = String(error?.stack || '')
    .split('\n')[1]
    ?.trim()
    .replace(/:\d+:\d+\)?$/, '') || 'unknown';
  return crypto.createHash('sha1').update(`${name}|${firstFrame}`).digest('hex').slice(0, 12);
}

/**
 * 上报一个错误。
 * @param {Error} error
 * @param {object} [context] 额外上下文（会被 logger 的 redact 规则过滤）
 * @param {'error'|'fatal'|'warn'} [level]
 */
function reportError(error, context = {}, level = 'error') {
  const fingerprint = fingerprintOf(error);
  const requestContext = getContext();

  logger[level]({
    err: { name: error?.name, message: error?.message, stack: error?.stack },
    fingerprint,
    ...requestContext,
    ...context
  }, error?.message || 'Unhandled error');

  const Sentry = getSentry();
  if (Sentry) {
    Sentry.withScope((scope) => {
      scope.setFingerprint([fingerprint]);
      scope.setLevel(level === 'fatal' ? 'fatal' : 'error');
      if (requestContext.requestId) scope.setTag('requestId', requestContext.requestId);
      if (requestContext.userId) scope.setUser({ id: requestContext.userId });
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
      Sentry.captureException(error);
    });
  }

  return fingerprint;
}

/**
 * 挂载进程级兜底：未捕获异常与未处理的 Promise rejection。
 * 没有这个，Node 里一个漏掉 await 的 rejection 会让进程静默退出，日志里什么都没有。
 */
function installProcessHandlers() {
  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    reportError(error, { source: 'unhandledRejection' }, 'fatal');
  });

  process.on('uncaughtException', (error) => {
    reportError(error, { source: 'uncaughtException' }, 'fatal');
    // 未捕获异常后进程状态已不可信，让编排层重启，而不是带病继续服务医疗请求
    setTimeout(() => process.exit(1), 1000).unref();
  });
}

module.exports = { reportError, fingerprintOf, installProcessHandlers };
