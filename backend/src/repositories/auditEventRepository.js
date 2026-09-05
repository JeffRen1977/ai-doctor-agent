/**
 * AuditEvent Repository 门面
 * 与其他 repository 一致：业务层不关心底层是 Firestore 还是 MongoDB。
 */
const adapters = require('../adapters');

module.exports = adapters.auditEventRepo;
