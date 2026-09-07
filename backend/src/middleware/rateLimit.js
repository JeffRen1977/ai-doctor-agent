/**
 * 分级限流 —— 保护两类资产：账号密码 与 大模型账单。
 *
 * 计数键的选择：优先用 JWT 里的用户身份，取不到才退回 IP。
 * 原因是移动网络大量用户共用出口 IP（运营商 NAT），纯 IP 计数会误伤整个小区的用户；
 * 而登录类接口尚无身份可言，只能按 IP + 账号计数。
 *
 * 档位：
 *   generalApiLimiter —— 所有 /api 的兜底闸门，防脚本失控
 *   authLimiter       —— /api/auth 全量，防撞库扫描
 *   loginLimiter      —— 单账号登录失败次数，防定向爆破（成功不计数）
 *   aiLimiter         —— 触发大模型的写接口，防账单被刷
 *   aiHeavyLimiter    —— 图片/PDF 等多模态重接口，成本最高，额度最紧
 */

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { verifyAuthToken } = require('../config/jwtConfig');

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** 读取整数型环境变量，非法或缺失时用默认值 */
function envInt(name, fallback) {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

/**
 * 从 Authorization 头解析出稳定的用户标识。
 * 这里只验签取 payload，不查库 —— 限流要在 authenticateToken 之前生效，
 * 且不该为一个被限流的请求付出一次数据库往返。
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function userKeyFromToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    const decoded = verifyAuthToken(match[1].trim());
    const id = decoded.userId || decoded.email;
    return id ? `user:${String(id).toLowerCase()}` : null;
  } catch {
    // token 无效/过期：按 IP 计数，避免攻击者用垃圾 token 绕开用户维度限流
    return null;
  }
}

/** 已登录按用户计数，未登录按 IP 计数（ipKeyGenerator 负责 IPv6 段规范化） */
function userOrIpKey(req) {
  return userKeyFromToken(req) || `ip:${ipKeyGenerator(req.ip)}`;
}

/** 登录/注册：同一 IP 对同一账号的尝试单独计数，避免一个 IP 拖垮全网关 */
function ipAndAccountKey(req) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  return `ip:${ipKeyGenerator(req.ip)}|account:${email || '(none)'}`;
}

/**
 * 生产环境永远启用限流；仅非生产可用 RATE_LIMIT_DISABLED 关闭（本地联调/E2E）。
 * 与 JWT 密钥同理：安全开关不允许在生产被环境变量关掉。
 */
function limitingDisabled() {
  return process.env.NODE_ENV !== 'production' && process.env.RATE_LIMIT_DISABLED === 'true';
}

function buildHandler(message) {
  return (req, res) => {
    const retryAfterSec = Math.ceil((req.rateLimit?.resetTime - Date.now()) / 1000) || undefined;
    res.status(429).json({
      success: false,
      error: message,
      code: 'RATE_LIMITED',
      retryAfter: retryAfterSec
    });
  };
}

/**
 * @param {object} opts
 * @param {number} opts.windowMs 统计窗口
 * @param {number} opts.limit 窗口内允许的请求数
 * @param {string} opts.message 429 时返回给用户的中文提示
 * @param {(req: import('express').Request) => string} [opts.keyGenerator]
 * @param {(req: import('express').Request) => boolean} [opts.skip]
 * @param {boolean} [opts.skipSuccessfulRequests]
 */
function createLimiter({ windowMs, limit, message, keyGenerator = userOrIpKey, skip, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    skipSuccessfulRequests,
    skip: (req, res) => limitingDisabled() || (skip ? skip(req, res) : false),
    standardHeaders: 'draft-7', // 返回 RateLimit / Retry-After，便于前端做退避
    legacyHeaders: false,
    handler: buildHandler(message)
  });
}

/** 所有 /api 的兜底闸门 */
const generalApiLimiter = createLimiter({
  windowMs: envInt('RATE_LIMIT_GENERAL_WINDOW_MS', 15 * MINUTE),
  limit: envInt('RATE_LIMIT_GENERAL_MAX', 300),
  message: '请求过于频繁，请稍后再试。'
});

/** /api/auth 全量：拦住枚举账号、批量注册这类扫描行为 */
const authLimiter = createLimiter({
  windowMs: envInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * MINUTE),
  limit: envInt('RATE_LIMIT_AUTH_MAX', 30),
  keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip)}`,
  message: '认证请求过于频繁，请 15 分钟后再试。'
});

/**
 * 单账号密码爆破防护。skipSuccessfulRequests 让正常用户不受影响：
 * 只有失败的尝试才消耗额度，密码输对了额度立刻不再累加。
 */
const loginLimiter = createLimiter({
  windowMs: envInt('RATE_LIMIT_LOGIN_WINDOW_MS', 15 * MINUTE),
  limit: envInt('RATE_LIMIT_LOGIN_MAX', 5),
  keyGenerator: ipAndAccountKey,
  skipSuccessfulRequests: true,
  message: '密码错误次数过多，该账号已暂时锁定登录，请 15 分钟后再试。'
});

/** 找回密码：按 IP+邮箱限制，避免对邮箱服务或用户收件箱做轰炸 */
const forgotPasswordLimiter = createLimiter({
  windowMs: envInt('RATE_LIMIT_FORGOT_WINDOW_MS', 15 * MINUTE),
  limit: envInt('RATE_LIMIT_FORGOT_MAX', 5),
  keyGenerator: ipAndAccountKey,
  message: '重置邮件发送过于频繁，请 15 分钟后再试。'
});

/** 注册：按 IP 限制批量刷号 */
const registerLimiter = createLimiter({
  windowMs: envInt('RATE_LIMIT_REGISTER_WINDOW_MS', HOUR),
  limit: envInt('RATE_LIMIT_REGISTER_MAX', 5),
  keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip)}`,
  message: '注册过于频繁，请 1 小时后再试。'
});

/** 只读请求不计入 AI 额度：这些路由的 GET 全是数据库读，不触发大模型 */
const skipReads = (req) => req.method === 'GET' || req.method === 'HEAD';

/** 触发大模型的写接口 */
const aiLimiter = createLimiter({
  windowMs: envInt('RATE_LIMIT_AI_WINDOW_MS', HOUR),
  limit: envInt('RATE_LIMIT_AI_MAX', 60),
  skip: skipReads,
  message: 'AI 分析请求已达用量上限，请 1 小时后再试。'
});

/** 图片/PDF 多模态与长报告：单次成本最高 */
const aiHeavyLimiter = createLimiter({
  windowMs: envInt('RATE_LIMIT_AI_HEAVY_WINDOW_MS', HOUR),
  limit: envInt('RATE_LIMIT_AI_HEAVY_MAX', 20),
  skip: skipReads,
  message: '文件分析请求已达用量上限，请 1 小时后再试。'
});

module.exports = {
  generalApiLimiter,
  authLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  registerLimiter,
  aiLimiter,
  aiHeavyLimiter,
  // 导出内部函数供单测覆盖
  userOrIpKey,
  ipAndAccountKey,
  userKeyFromToken,
  limitingDisabled
};
