/**
 * MongoDB Adapter: UserWearables（与 firebase/userWearablesAdapter 同接口）
 * 集合 userWearables；单文档 per user _id=userId；listHistoryByUser 按 userEmail。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'userWearables';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function stripUndefined(obj) {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = stripUndefined(v);
    else out[k] = null;
  }
  return out;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  ['createdAt', 'updatedAt', 'lastSync', 'fitbitLastSync', 'appleLastSync'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  if (out.fitbitTokens?.created_at != null) {
    out.fitbitTokens = { ...out.fitbitTokens, created_at: toPlainValue(out.fitbitTokens.created_at) || out.fitbitTokens.created_at };
  }
  return out;
}

async function getUserWearables(userId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  if (!doc) return null;
  return sanitize(doc);
}

async function setUserWearables(userId, data) {
  const col = getCollection(COLLECTION);
  const payload = typeof data === 'object' && data !== null ? stripUndefined(data) : {};
  await col.updateOne(
    { _id: userId },
    { $set: payload },
    { upsert: true }
  );
}

/**
 * @param {string} userEmail
 * @param {{ limit?: number }} [options]
 */
async function listHistoryByUser(userEmail, options = {}) {
  const col = getCollection(COLLECTION);
  const { limit: limitCount = 30 } = options;
  const docs = await col
    .find({ userEmail: userEmail || '' })
    .sort({ lastSync: -1 })
    .limit(limitCount)
    .toArray();
  return docs.map((d) => {
    const data = sanitize(d);
    const id = d._id != null && typeof d._id.toString === 'function' ? d._id.toString() : String(d._id || '');
    return {
      id,
      timestamp: (data && data.lastSync) || null,
      ...data
    };
  });
}

module.exports = {
  getUserWearables,
  setUserWearables,
  listHistoryByUser,
  sanitize
};
