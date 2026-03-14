/**
 * MongoDB Adapter: PersonalHealthRecord（与 firebase/personalHealthRecordAdapter 同接口）
 * 集合 personalHealthRecords；_id = sanitizeUserId(userId)；get/set/update。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'personalHealthRecords';

function sanitizeUserId(emailOrId) {
  return (emailOrId || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function recursivelyConvertTimestamps(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(recursivelyConvertTimestamps);
  if (obj && typeof obj.toDate === 'function') return toPlainValue(obj);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = recursivelyConvertTimestamps(v);
    }
    return out;
  }
  return obj;
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

async function get(userId) {
  const col = getCollection(COLLECTION);
  const id = sanitizeUserId(userId);
  const doc = await col.findOne({ _id: id });
  if (!doc) return null;
  return recursivelyConvertTimestamps(doc);
}

async function set(userId, data, merge = true) {
  const col = getCollection(COLLECTION);
  const id = sanitizeUserId(userId);
  const payload = stripUndefined(data);
  if (merge) {
    await col.updateOne({ _id: id }, { $set: payload }, { upsert: true });
  } else {
    await col.replaceOne({ _id: id }, { _id: id, ...payload }, { upsert: true });
  }
}

async function update(userId, updates) {
  const col = getCollection(COLLECTION);
  const id = sanitizeUserId(userId);
  const payload = stripUndefined(updates);
  await col.updateOne({ _id: id }, { $set: payload }, { upsert: true });
}

module.exports = {
  get,
  set,
  update,
  sanitizeUserId
};
