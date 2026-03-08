/**
 * 风险监测状态（单文档 per user）
 * 用于节流等，当前服务读写字段：lastAutoDetectAt、userEmail。
 * 节流间隔由 riskMonitoringService 内常量控制，不在此存储。
 */

/**
 * 状态文档形状（Firestore riskMonitoringState/{userId}）
 * @typedef {Object} RiskMonitoringState
 * @property {string} [userId] - 文档 id（一般为 userEmail 的 sanitized 形式，如 . → _）
 * @property {string} [lastAutoDetectAt] - 上次自动异常检测时间 ISO 字符串
 * @property {string} [userEmail] - 用户邮箱
 */

/**
 * 从 userEmail 生成文档 id（与原有 Firestore 约定一致）
 * @param {string} userEmail
 * @returns {string}
 */
function userIdFromEmail(userEmail) {
  return (userEmail || '').replace(/\./g, '_');
}

module.exports = {
  userIdFromEmail
};
