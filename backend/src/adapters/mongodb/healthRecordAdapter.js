/**
 * MongoDB Adapter: HealthRecord（与 firebase/healthRecordAdapter 同接口）
 * 集合 healthRecords；_id = sanitizedEmail；list by userEmail。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'healthRecords';

function sanitizeEmail(email) {
  return (email || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

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

function fromFirestore(data) {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };
  if (out.createdAt != null) out.createdAt = toPlainValue(out.createdAt) || out.createdAt;
  if (out.updatedAt != null) out.updatedAt = toPlainValue(out.updatedAt) || out.updatedAt;
  if (out.lastAnalysisDate != null) out.lastAnalysisDate = toPlainValue(out.lastAnalysisDate) || out.lastAnalysisDate;
  return out;
}

async function getByUser(sanitizedEmail) {
  const col = getCollection(COLLECTION);
  const id = sanitizeEmail(sanitizedEmail);
  const doc = await col.findOne({ _id: id });
  if (!doc) return null;
  const idStr = doc._id != null && typeof doc._id.toString === 'function' ? doc._id.toString() : String(doc._id || '');
  return fromFirestore({ id: idStr, ...doc });
}

async function setByUser(sanitizedEmail, data, merge = true) {
  const col = getCollection(COLLECTION);
  const id = sanitizeEmail(sanitizedEmail);
  const payload = stripUndefined(data);
  if (merge) {
    await col.updateOne({ _id: id }, { $set: payload }, { upsert: true });
  } else {
    await col.replaceOne({ _id: id }, { _id: id, ...payload }, { upsert: true });
  }
}

async function listByUser(userEmail, options = {}) {
  const col = getCollection(COLLECTION);
  const { limit: limitCount = 20 } = options;
  const docs = await col
    .find({ userEmail: userEmail || '' })
    .sort({ createdAt: -1 })
    .limit(limitCount)
    .toArray();
  return docs.map((d) => {
    const idStr = d._id != null && typeof d._id.toString === 'function' ? d._id.toString() : String(d._id || '');
    return fromFirestore({ id: idStr, ...d });
  });
}

module.exports = {
  getByUser,
  setByUser,
  listByUser,
  sanitizeEmail,
  fromFirestore
};
