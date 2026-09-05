/**
 * 请求日志 —— 取代 morgan('combined')。
 *
 * 与 morgan 的区别：
 *   1. 输出 JSON 而非一行文本，可按字段检索；
 *   2. 为每个请求生成 requestId 并放进 AsyncLocalStorage，后续所有日志自动携带；
 *   3. 把 requestId 回写到响应头 x-request-id —— 用户报障时截图里就有这个 ID，
 *      客服拿着它能直接定位到当次请求的全部日志与审计记录。
 */

const logger = require('../observability/logger');
const { newRequestId, runWithContext, setContextValue } = require('../observability/requestContext');

/** 健康检查与静态资源不写访问日志，避免淹没真实流量 */
const SILENT_PATHS = new Set(['/health', '/favicon.ico']);

function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || newRequestId();
  const startedAt = process.hrtime.bigint();
  // 必须在进入子路由前取：挂载路由会把 req.path 重写成相对路径，
  // 到 res.on('finish') 时读到的会是 '/me' 而不是 '/api/auth/me'。
  const fullPath = req.originalUrl.split('?')[0];

  res.setHeader('x-request-id', requestId);

  runWithContext({ requestId, route: `${req.method} ${fullPath}` }, () => {
    // 认证中间件跑完后 req.user 才存在，这里在响应结束时补记
    res.on('finish', () => {
      if (SILENT_PATHS.has(fullPath)) return;

      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      if (req.user?.id) setContextValue('userId', req.user.id);

      const payload = {
        method: req.method,
        path: fullPath,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id
      };

      // 4xx 用 warn、5xx 用 error，这样告警规则可以只盯 level>=error
      if (res.statusCode >= 500) logger.error(payload, 'request failed');
      else if (res.statusCode === 429) logger.warn({ ...payload, event: 'rate_limited' }, 'request rate limited');
      else if (res.statusCode >= 400) logger.warn(payload, 'request rejected');
      else logger.info(payload, 'request completed');
    });

    next();
  });
}

module.exports = { requestLogger };
