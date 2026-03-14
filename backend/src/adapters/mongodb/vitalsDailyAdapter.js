/**
 * MongoDB Adapter: VitalsDaily（与 firebase/vitalsDailyAdapter 同接口）
 * 独立集合 vitalsDaily，文档含 userId，_id = `${userId}_${date}` 或复合查询。
 */
const { getCollection } = require('./connection');
const { validateVitalsDaily } = require('../../models/vitalsDaily');

const COLLECTION = 'vitalsDaily';

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

function fromFirestoreDoc(data, dateId) {
  if (!data) return null;
  const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v);
  const dateStr = data.date != null
    ? (typeof data.date === 'string' ? data.date : (data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date)))
    : dateId;
  const item = {
    userId: data.userId,
    userEmail: data.userEmail,
    date: dateStr,
    source: data.source,
    summary: data.summary || {},
    anomalies: data.anomalies || [],
    trend: data.trend ?? null,
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
    createdAt: data.createdAt ? toDate(data.createdAt) : undefined
  };
  const result = validateVitalsDaily(item);
  if (result.error) return null;
  return result.value;
}

function toFirestoreDoc(payload) {
  const o = { ...payload };
  if (o.updatedAt instanceof Date) o.updatedAt = o.updatedAt;
  if (o.createdAt instanceof Date) o.createdAt = o.createdAt;
  return o;
}

async function getVitalsDaily(userId, date) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ userId: String(userId || ''), date: String(date || '') });
  if (!doc) return null;
  return fromFirestoreDoc(doc, date);
}

async function upsertVitalsDaily(userId, date, payload) {
  const col = getCollection(COLLECTION);
  const normalized = {
    ...payload,
    date,
    userId: payload.userId || userId,
    userEmail: payload.userEmail,
    updatedAt: payload.updatedAt || new Date(),
    createdAt: payload.createdAt || payload.updatedAt || new Date()
  };
  const result = validateVitalsDaily(normalized);
  if (result.error) throw new Error(result.error.message);
  const filter = { userId: String(userId || ''), date: String(date || '') };
  const toWrite = stripUndefined(toFirestoreDoc(result.value));
  await col.updateOne(filter, { $set: { ...toWrite, userId: filter.userId, date: filter.date } }, { upsert: true });
}

module.exports = {
  getVitalsDaily,
  upsertVitalsDaily,
  fromFirestoreDoc,
  toFirestoreDoc
};
