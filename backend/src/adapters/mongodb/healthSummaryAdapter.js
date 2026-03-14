/**
 * MongoDB Adapter: 健康总览（与 firebase/healthSummaryAdapter 同接口）
 * 集合 healthSummaries，文档 _id = userId。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'healthSummaries';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.updatedAt != null) out.updatedAt = toPlainValue(out.updatedAt) || out.updatedAt;
  return out;
}

async function getHealthSummary(userId) {
  if (!userId) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return sanitize(rest);
}

async function setHealthSummary(userId, data) {
  if (!userId) throw new Error('userId required');
  const col = getCollection(COLLECTION);
  const updatedAt = data.updatedAt || new Date().toISOString();
  await col.updateOne(
    { _id: userId },
    { $set: { ...data, updatedAt } },
    { upsert: true }
  );
}

module.exports = {
  getHealthSummary,
  setHealthSummary
};
