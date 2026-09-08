/**
 * 集中错误处理 —— Express 的最后一道网。
 *
 * 现有路由大多自己 try/catch 后返回 500，这个中间件不替换它们，
 * 而是接住漏网的同步/异步抛错：没有它，一个中间件里的抛错会让请求挂起或
 * 由 Express 默认处理器把堆栈直接吐给客户端（生产环境等于信息泄露）。
 *
 * 对客户端只返回 requestId，不返回堆栈 —— 用户把 ID 报给客服即可定位。
 */

const { reportError } = require('../observability/errorReporter');
const { getContext } = require('../observability/requestContext');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // CORS 拒绝属于预期内的拒绝，不算故障，不必污染错误率指标
  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, error: 'Origin not allowed' });
  }

  const status = Number(err?.status || err?.statusCode) || 500;
  const fingerprint = reportError(err, {
    method: req.method,
    path: req.originalUrl?.split('?')[0] ?? req.path,
    status
  }, status >= 500 ? 'error' : 'warn');

  if (res.headersSent) return next(err);

  const body = {
    success: false,
    error: status >= 500 ? '服务器内部错误' : (err.message || '请求无法处理'),
    requestId: getContext().requestId,
    // 指纹不含用户数据，给出来便于用户/客服在工单里指认同一类问题
    errorId: fingerprint
  };
  if (err?.code) body.code = err.code;
  if (err?.purpose) body.purpose = err.purpose;
  return res.status(status).json(body);
}

/** 未匹配任何路由的 /api 请求，返回结构化 404 而不是落到前端 index.html */
function apiNotFound(req, res) {
  return res.status(404).json({
    success: false,
    error: `API 不存在: ${req.method} ${req.originalUrl.split('?')[0]}`,
    requestId: getContext().requestId
  });
}

module.exports = { errorHandler, apiNotFound };
