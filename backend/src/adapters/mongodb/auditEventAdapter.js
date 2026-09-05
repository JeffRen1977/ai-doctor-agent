/**
 * MongoDB Adapter: AuditEvent（与 firebase/auditEventAdapter 同接口）
 * 集合 auditEvents。只提供追加与查询，刻意不提供 update/delete —— 审计记录不可篡改。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'auditEvents';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function docToEvent(doc) {
  if (!doc) return null;
  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return {
    id,
    action: doc.action ?? '',
    actorId: doc.actorId ?? null,
    actorEmail: doc.actorEmail ?? null,
    subjectEmail: doc.subjectEmail ?? null,
    timestamp: toPlainValue(doc.timestamp) || '',
    requestId: doc.requestId ?? null,
    operation: doc.operation ?? null,
    provider: doc.provider ?? null,
    model: doc.model ?? null,
    latencyMs: doc.latencyMs ?? null,
    success: !!doc.success,
    errorMessage: doc.errorMessage ?? null,
    inputDigest: doc.inputDigest ?? null,
    inputSummary: doc.inputSummary ?? null,
    outputDigest: doc.outputDigest ?? null,
    outputSummary: doc.outputSummary ?? null,
    metadata: doc.metadata ?? {}
  };
}

/**
 * @param {Object} event 已通过 validateAuditEvent 的审计事件
 * @returns {Promise<{ id: string }>}
 */
async function appendEvent(event) {
  const col = getCollection(COLLECTION);
  const payload = { ...event, timestamp: event.timestamp || new Date().toISOString() };
  const result = await col.insertOne(payload);
  return { id: result.insertedId ? result.insertedId.toString() : '', ...payload };
}

/**
 * @param {string} subjectEmail 数据主体
 * @param {{limit?: number, action?: string, since?: string}} [options]
 */
async function listBySubject(subjectEmail, options = {}) {
  const col = getCollection(COLLECTION);
  const filter = { subjectEmail: subjectEmail || '' };
  if (options.action) filter.action = options.action;
  if (options.since) filter.timestamp = { $gte: options.since };
  const docs = await col.find(filter).sort({ timestamp: -1 }).limit(options.limit || 50).toArray();
  return docs.map(docToEvent).filter(Boolean);
}

/** 按 requestId 取回一次请求产生的全部审计记录，用于事故复盘 */
async function listByRequestId(requestId) {
  const col = getCollection(COLLECTION);
  const docs = await col.find({ requestId: requestId || '' }).sort({ timestamp: 1 }).toArray();
  return docs.map(docToEvent).filter(Boolean);
}

module.exports = { appendEvent, listBySubject, listByRequestId, docToEvent };
