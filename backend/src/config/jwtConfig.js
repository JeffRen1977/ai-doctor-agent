/**
 * 单一 JWT 密钥来源 —— 快速失败，绝不兜底。
 *
 * 历史实现在 10 处写了 `process.env.JWT_SECRET || 'your-secret-key'`。
 * 该兜底值随源码公开，一旦生产漏配 JWT_SECRET，任何人都能为任意 userId
 * 伪造合法 token 并读取全部病历。所以密钥缺失/过弱必须在进程启动时炸掉，
 * 而不是等到第一次登录时静默降级。
 */

const jwt = require('jsonwebtoken');

const MIN_SECRET_LENGTH = 32;
const DEFAULT_EXPIRES_IN = '7d';

/** 曾出现在本仓库或部署脚本中、因而已经公开的占位密钥 */
const BANNED_SECRETS = new Set([
  'your-secret-key',
  'your-super-secret-jwt-key-here',
  'your-jwt-secret',
  'changeme',
  'secret',
  'test'
]);

const REMEDY =
  '请生成并配置一个强密钥：`openssl rand -hex 64`，' +
  '然后写入 backend/.env（本地）与部署平台的环境变量（Railway / Vercel）。';

/**
 * 返回不可用的原因；密钥合格时返回 null。
 * @param {string|undefined} secret
 * @returns {string|null}
 */
function describeProblem(secret) {
  if (typeof secret !== 'string' || secret.trim() === '') {
    return 'JWT_SECRET 未配置';
  }
  if (BANNED_SECRETS.has(secret.trim().toLowerCase())) {
    return 'JWT_SECRET 使用了公开的占位值，等同于没有密钥';
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    return `JWT_SECRET 长度仅 ${secret.length} 字符，至少需要 ${MIN_SECRET_LENGTH} 字符`;
  }
  return null;
}

/**
 * 取签名/校验用密钥；不合格直接抛错，没有任何默认值。
 * @returns {string}
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const problem = describeProblem(secret);
  if (problem) {
    throw new Error(`${problem}。${REMEDY}`);
  }
  return secret;
}

/**
 * 启动时调用：密钥不合格则让进程起不来（fail fast）。
 */
function assertJwtSecretConfigured() {
  getJwtSecret();
}

/**
 * 签发用户认证 token。有效期由 JWT_EXPIRES_IN 覆盖，默认 7d。
 * @param {object} payload
 * @param {object} [options] 透传给 jsonwebtoken 的额外选项
 * @returns {string}
 */
function signAuthToken(payload, options = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN,
    ...options
  });
}

/**
 * 校验用户认证 token；无效或过期时抛错（由调用方转成 401/403）。
 * @param {string} token
 * @returns {object}
 */
function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 };
const DEFAULT_TTL_SECONDS = 7 * 24 * 3600;

/**
 * 把 JWT_EXPIRES_IN 这类值（7d / 15m / 3600）转成秒。无法解析时用 7 天。
 * @param {string|undefined} value
 * @param {number} [fallbackSeconds]
 * @returns {number}
 */
function durationToSeconds(value, fallbackSeconds = DEFAULT_TTL_SECONDS) {
  if (value == null || String(value).trim() === '') return fallbackSeconds;
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) return Number(raw);
  const match = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return fallbackSeconds;
  return Number(match[1]) * UNIT_SECONDS[match[2].toLowerCase()];
}

/**
 * 刷新专用：签名必须合法，允许已过期，但过期超过 JWT 有效期（默认 7 天）则拒绝。
 * 这样「手里有旧票」才能换新票，光知道 userId+email 不行。
 * @param {string} token
 * @returns {object}
 */
function verifyAuthTokenAllowExpired(token) {
  const decoded = jwt.verify(token, getJwtSecret(), { ignoreExpiration: true });
  const graceSec = durationToSeconds(process.env.JWT_EXPIRES_IN, DEFAULT_TTL_SECONDS);
  const now = Math.floor(Date.now() / 1000);
  if (typeof decoded.exp === 'number' && now - decoded.exp > graceSec) {
    const error = new Error('Token refresh window exceeded');
    error.name = 'TokenExpiredError';
    throw error;
  }
  return decoded;
}

module.exports = {
  MIN_SECRET_LENGTH,
  BANNED_SECRETS,
  describeProblem,
  getJwtSecret,
  assertJwtSecretConfigured,
  signAuthToken,
  verifyAuthToken,
  verifyAuthTokenAllowExpired,
  durationToSeconds
};
