/**
 * MongoDB Adapter: Medication（与 firebase/medicationAdapter 同接口）
 * 独立集合 medications，文档含 userId、id。
 */
const { getCollection } = require('./connection');
const { validateMedication } = require('../../models/medication');

const COLLECTION = 'medications';

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

function fromFirestoreDoc(data) {
  if (!data) return null;
  const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v);
  const item = {
    id: data.id,
    name: data.name || '',
    dosage: data.dosage,
    frequency: data.frequency,
    time: data.time || [],
    route: data.route,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status === 'completed' || data.status === 'discontinued' ? 'stopped' : (data.status || 'active'),
    purpose: data.purpose,
    prescribingDoctor: data.prescribingDoctor,
    schedule: data.schedule || [],
    history: data.history || [],
    updatedAt: toDate(data.updatedAt),
    createdAt: toDate(data.createdAt)
  };
  const result = validateMedication(item);
  if (result.error) return null;
  return result.value;
}

function toFirestoreDoc(med) {
  const m = { ...med };
  if (m.updatedAt instanceof Date) m.updatedAt = m.updatedAt;
  if (m.createdAt instanceof Date) m.createdAt = m.createdAt;
  return m;
}

async function listActive(userId) {
  const col = getCollection(COLLECTION);
  const docs = await col.find({ userId: userId || '', status: 'active' }).toArray();
  return docs.map((d) => fromFirestoreDoc({ id: d.id, ...d })).filter(Boolean);
}

async function add(userId, item) {
  const col = getCollection(COLLECTION);
  const id = item.id || `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const med = {
    ...item,
    id,
    userId,
    status: item.status || 'active',
    schedule: item.schedule || [],
    history: item.history || [],
    updatedAt: now,
    createdAt: item.createdAt || now
  };
  const validated = validateMedication(med);
  if (validated.error) throw new Error(validated.error.message);
  const payload = stripUndefined(toFirestoreDoc(validated.value));
  await col.insertOne(payload);
  return validated.value;
}

async function update(userId, medicationId, patch) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ userId: userId || '', id: medicationId });
  if (!doc) return;
  const updated = { ...doc, ...patch, id: medicationId, updatedAt: new Date() };
  delete updated._id;
  await col.updateOne(
    { userId: userId || '', id: medicationId },
    { $set: stripUndefined(updated) }
  );
}

async function remove(userId, medicationId) {
  const col = getCollection(COLLECTION);
  await col.deleteOne({ userId: userId || '', id: medicationId });
}

async function deleteByUser(userId) {
  const col = getCollection(COLLECTION);
  const result = await col.deleteMany({ userId: userId || '' });
  return { deletedCount: result.deletedCount };
}

module.exports = {
  listActive,
  add,
  update,
  remove,
  deleteByUser,
  fromFirestoreDoc,
  toFirestoreDoc
};
