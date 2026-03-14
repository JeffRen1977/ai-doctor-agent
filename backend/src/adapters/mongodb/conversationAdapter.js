/**
 * MongoDB Adapter: Conversation（与 firebase/conversationAdapter 同接口）
 * 集合 conversations；多文档，按 userEmail；_id = conversationId。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'conversations';

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

function docToConversation(doc) {
  if (!doc) return null;
  const conversationId = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return {
    conversationId,
    ...doc,
    updatedAt: toPlainValue(doc.updatedAt) || doc.updatedAt,
    createdAt: doc.createdAt != null ? toPlainValue(doc.createdAt) || doc.createdAt : doc.createdAt
  };
}

function sanitizeConversation(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.updatedAt != null) out.updatedAt = toPlainValue(out.updatedAt) || out.updatedAt;
  if (out.createdAt != null) out.createdAt = toPlainValue(out.createdAt) || out.createdAt;
  return out;
}

async function getActiveConversationsByUser(userEmail, limitCount = 5) {
  const col = getCollection(COLLECTION);
  const docs = await col
    .find({ userEmail: userEmail || '' })
    .sort({ updatedAt: -1 })
    .limit(limitCount)
    .toArray();
  return docs.map(docToConversation).filter(Boolean);
}

async function saveConversation(conversation) {
  const col = getCollection(COLLECTION);
  const conversationId = conversation.conversationId;
  const payload = stripUndefined({ ...conversation });
  await col.updateOne(
    { _id: conversationId },
    { $set: payload },
    { upsert: true }
  );
}

async function getConversation(conversationId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: conversationId });
  if (!doc) return null;
  const conversationIdStr = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return sanitizeConversation({ conversationId: conversationIdStr, ...doc });
}

async function listByUser(userEmail, limitCount = 20) {
  const col = getCollection(COLLECTION);
  const docs = await col
    .find({ userEmail: userEmail || '' })
    .sort({ updatedAt: -1 })
    .limit(limitCount)
    .toArray();
  return docs.map((d) => {
    const cid = d._id instanceof ObjectId ? d._id.toString() : String(d._id || '');
    return sanitizeConversation({ conversationId: cid, ...d });
  }).filter(Boolean);
}

async function updateConversation(conversationId, updates) {
  const col = getCollection(COLLECTION);
  const payload = stripUndefined({ ...updates, updatedAt: new Date().toISOString() });
  await col.updateOne({ _id: conversationId }, { $set: payload });
}

async function deleteConversation(conversationId) {
  const col = getCollection(COLLECTION);
  await col.deleteOne({ _id: conversationId });
}

module.exports = {
  getActiveConversationsByUser,
  saveConversation,
  getConversation,
  listByUser,
  updateConversation,
  deleteConversation,
  docToConversation,
  sanitizeConversation
};
