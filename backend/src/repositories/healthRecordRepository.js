/**
 * Repository 接口契约：HealthRecord（健康档案 - healthRecords 集合）
 * 与 healthAnalysisService、digitalTwin 对齐。单文档 per user（documentId = sanitizedEmail）。
 *
 * @interface
 * getByUser(sanitizedEmail) => Promise<Object | null>
 * setByUser(sanitizedEmail, data, merge?) => Promise<void>
 * listByUser(userEmail, options?) => Promise<Array<{ id, ...data }>>  // 查询 by userEmail, orderBy createdAt desc, limit
 */

function notImplemented() {
  throw new Error('HealthRecord repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getByUser: () => notImplemented(),
  setByUser: () => notImplemented(),
  listByUser: () => notImplemented()
};
