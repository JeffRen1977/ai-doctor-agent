/**
 * Repository 接口契约：PersonalHealthRecord（个人健康档案 - personalHealthRecords 根文档）
 * 与 firebaseService、routes/healthRecords 对齐。单文档 per user（documentId = sanitized email）。
 *
 * @interface
 * get(userId) => Promise<Object | null>   // 根文档 data，Timestamp -> ISO
 * set(userId, data, merge?) => Promise<void>
 * update(userId, updates) => Promise<void>
 */

function notImplemented() {
  throw new Error('PersonalHealthRecord repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  get: () => notImplemented(),
  set: () => notImplemented(),
  update: () => notImplemented()
};
