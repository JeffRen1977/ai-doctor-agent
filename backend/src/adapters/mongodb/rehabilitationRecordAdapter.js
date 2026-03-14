/**
 * MongoDB Adapter: RehabilitationRecord（与 firebase/rehabilitationRecordAdapter 同接口）
 * 集合 rehabilitationRecords，多文档，userEmail + type + timestamp 查询。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'rehabilitationRecords';

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

function docToRecord(doc) {
  if (!doc) return null;
  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  const { _id, ...rest } = doc;
  return {
    id,
    ...rest,
    timestamp: toPlainValue(doc.timestamp) || doc.timestamp,
    createdAt: toPlainValue(doc.createdAt) || doc.createdAt,
    updatedAt: toPlainValue(doc.updatedAt) || doc.updatedAt
  };
}

async function addRehabilitationRecord(record) {
  const col = getCollection(COLLECTION);
  const payload = stripUndefined(record);
  const result = await col.insertOne(payload);
  const id = result.insertedId ? result.insertedId.toString() : '';
  return { id, ...record };
}

async function getRehabilitationRecords(userEmail, options = {}) {
  const { type = null, subtype = null, limitCount = 20 } = options;
  const col = getCollection(COLLECTION);
  const filter = { userEmail };
  if (type) filter.type = type;
  if (subtype && type) filter.subtype = subtype;
  const cursor = col.find(filter).sort({ timestamp: -1 }).limit(limitCount);
  const docs = await cursor.toArray();
  const records = docs.map(docToRecord).filter(Boolean);
  return { records, count: records.length };
}

async function updateRehabilitationRecordFeedback(recordId, userEmail, feedback) {
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();
  const update = {
    feedback: {
      effectiveness: feedback.effectiveness,
      helpful: feedback.helpful ?? null,
      comments: feedback.comments ?? '',
      timestamp: feedback.timestamp || now
    },
    updatedAt: now
  };
  const byRecordId = await col.findOne({ recordId, userEmail });
  if (byRecordId) {
    await col.updateOne({ _id: byRecordId._id }, { $set: update });
    return;
  }
  if (ObjectId.isValid(recordId) && recordId.length === 24) {
    await col.updateOne({ _id: new ObjectId(recordId) }, { $set: update });
  }
}

module.exports = {
  addRehabilitationRecord,
  getRehabilitationRecords,
  updateRehabilitationRecordFeedback,
  docToRecord
};
