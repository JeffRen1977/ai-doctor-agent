/**
 * Firebase Adapter: AuditEvent
 * 读写 auditEvents 集合。只提供追加与查询，刻意不提供 update/delete —— 审计记录不可篡改。
 * 仅依赖 config/firebase，不依赖 services 或 routes。
 */

const { collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'auditEvents';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function docToEvent(docSnap) {
  const data = docSnap.data();
  if (!data) return null;
  return {
    id: docSnap.id,
    action: data.action ?? '',
    actorId: data.actorId ?? null,
    actorEmail: data.actorEmail ?? null,
    subjectEmail: data.subjectEmail ?? null,
    timestamp: toPlainValue(data.timestamp) || '',
    requestId: data.requestId ?? null,
    operation: data.operation ?? null,
    provider: data.provider ?? null,
    model: data.model ?? null,
    latencyMs: data.latencyMs ?? null,
    success: !!data.success,
    errorMessage: data.errorMessage ?? null,
    inputDigest: data.inputDigest ?? null,
    inputSummary: data.inputSummary ?? null,
    outputDigest: data.outputDigest ?? null,
    outputSummary: data.outputSummary ?? null,
    metadata: data.metadata ?? {}
  };
}

/**
 * @param {Object} event 已通过 validateAuditEvent 的审计事件
 * @returns {Promise<{ id: string }>}
 */
async function appendEvent(event) {
  const ref = collection(db, COLLECTION);
  const payload = { ...event, timestamp: event.timestamp || new Date().toISOString() };
  const created = await addDoc(ref, payload);
  return { id: created.id, ...payload };
}

/**
 * @param {string} subjectEmail 数据主体
 * @param {{limit?: number, action?: string}} [options]
 */
async function listBySubject(subjectEmail, options = {}) {
  const ref = collection(db, COLLECTION);
  const clauses = [where('subjectEmail', '==', subjectEmail || '')];
  if (options.action) clauses.push(where('action', '==', options.action));
  const q = query(ref, ...clauses, orderBy('timestamp', 'desc'), limit(options.limit || 50));
  const snap = await getDocs(q);
  return snap.docs.map(docToEvent).filter(Boolean);
}

/** 按 requestId 取回一次请求产生的全部审计记录，用于事故复盘 */
async function listByRequestId(requestId) {
  const ref = collection(db, COLLECTION);
  const q = query(ref, where('requestId', '==', requestId || ''), orderBy('timestamp', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(docToEvent).filter(Boolean);
}

async function redactSummariesBySubject(subjectEmail, hashedSubject) {
  const ref = collection(db, COLLECTION);
  const q = query(ref, where('subjectEmail', '==', subjectEmail || ''));
  const snap = await getDocs(q);
  let modifiedCount = 0;
  for (const d of snap.docs) {
    await updateDoc(doc(db, COLLECTION, d.id), {
      inputSummary: null,
      outputSummary: null,
      subjectEmail: hashedSubject,
      actorEmail: hashedSubject,
      redactedAt: new Date().toISOString()
    });
    modifiedCount += 1;
  }
  return { modifiedCount };
}

module.exports = { appendEvent, listBySubject, listByRequestId, redactSummariesBySubject, docToEvent };
