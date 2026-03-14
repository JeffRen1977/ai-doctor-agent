/**
 * MongoDB Adapter: RiskMonitoringState（与 firebase/riskMonitoringStateAdapter 同接口）
 * 集合 riskMonitoringState，文档 _id = userId。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'riskMonitoringState';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function fromFirestore(data) {
  if (!data || typeof data !== 'object') return null;
  return {
    lastAutoDetectAt: data.lastAutoDetectAt != null ? toPlainValue(data.lastAutoDetectAt) : undefined,
    userEmail: data.userEmail
  };
}

async function getRiskMonitoringState(userId) {
  if (!userId) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  if (!doc) return null;
  return fromFirestore(doc);
}

async function setRiskMonitoringState(userId, data) {
  if (!userId) throw new Error('userId required');
  const col = getCollection(COLLECTION);
  await col.updateOne({ _id: userId }, { $set: data }, { upsert: true });
}

module.exports = {
  getRiskMonitoringState,
  setRiskMonitoringState,
  fromFirestore
};
