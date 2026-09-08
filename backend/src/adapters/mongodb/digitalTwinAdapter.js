/**
 * MongoDB Adapter: DigitalTwin（与 firebase/digitalTwinAdapter 同接口）
 * 集合 digitalTwins，文档 _id = sanitizeUserId(userEmail)。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'digitalTwins';

function sanitizeUserId(userEmail) {
  return (userEmail || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.lastUpdated != null) out.lastUpdated = toPlainValue(out.lastUpdated) || out.lastUpdated;
  return out;
}

async function getDigitalTwin(userId) {
  const id = sanitizeUserId(userId);
  if (!id) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: id });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return sanitize(rest);
}

async function setDigitalTwin(userId, data) {
  const id = sanitizeUserId(userId);
  if (!id) throw new Error('userId required');
  const col = getCollection(COLLECTION);
  await col.updateOne({ _id: id }, { $set: data }, { upsert: true });
}

async function deleteDigitalTwin(userId) {
  const id = sanitizeUserId(userId);
  if (!id) return { deletedCount: 0 };
  const col = getCollection(COLLECTION);
  const result = await col.deleteOne({ _id: id });
  return { deletedCount: result.deletedCount };
}

module.exports = {
  getDigitalTwin,
  setDigitalTwin,
  deleteDigitalTwin,
  sanitizeUserId,
  sanitize
};
