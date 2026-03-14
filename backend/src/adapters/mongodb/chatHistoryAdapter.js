/**
 * MongoDB Adapter: ChatHistory（与 firebase/chatHistoryAdapter 同接口）
 * 集合 chatHistory；doc id 可为 userEmail 或自动生成。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'chatHistory';

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
  ['createdAt', 'updatedAt', 'lastActivity', 'deletedAt'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  if (out.messages && Array.isArray(out.messages)) {
    out.messages = out.messages.map((m) => {
      if (m && m.timestamp != null) return { ...m, timestamp: toPlainValue(m.timestamp) || m.timestamp };
      return m;
    });
  }
  return out;
}

async function addDocument(data) {
  const col = getCollection(COLLECTION);
  const payload = stripUndefined(data);
  const result = await col.insertOne(payload);
  const id = result.insertedId ? result.insertedId.toString() : '';
  return { id };
}

async function getDocument(id) {
  const col = getCollection(COLLECTION);
  const filter = ObjectId.isValid(id) && String(id).length === 24 ? { _id: new ObjectId(id) } : { _id: id };
  const doc = await col.findOne(filter);
  if (!doc) return null;
  const idStr = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return sanitize({ id: idStr, ...doc });
}

async function listAll() {
  const col = getCollection(COLLECTION);
  const docs = await col.find({}).toArray();
  return docs.map((d) => {
    const idStr = d._id instanceof ObjectId ? d._id.toString() : String(d._id || '');
    return sanitize({ id: idStr, ...d });
  }).filter(Boolean);
}

async function getByUser(userEmail) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userEmail });
  if (!doc) return null;
  return sanitize({ id: doc._id, ...doc });
}

async function setByUser(userEmail, data) {
  const col = getCollection(COLLECTION);
  const payload = stripUndefined(data);
  await col.updateOne(
    { _id: userEmail },
    { $set: payload },
    { upsert: true }
  );
}

module.exports = {
  addDocument,
  getDocument,
  listAll,
  getByUser,
  setByUser,
  sanitize
};
