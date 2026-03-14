/**
 * MongoDB Adapter: Appointment（与 firebase/appointmentAdapter 同接口）
 * 集合 appointments；_id = appointmentId；list by userEmail + filters。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'appointments';

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

function sanitize(d) {
  if (!d || typeof d !== 'object') return null;
  const out = { ...d };
  ['scheduledDateTime', 'createdAt', 'updatedAt'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  return out;
}

async function saveAppointment(appointment) {
  const col = getCollection(COLLECTION);
  const appointmentId = appointment.appointmentId;
  const payload = stripUndefined({ ...appointment });
  await col.updateOne(
    { _id: appointmentId },
    { $set: payload },
    { upsert: true }
  );
}

async function getAppointment(appointmentId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: appointmentId });
  if (!doc) return null;
  const idStr = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return sanitize({ appointmentId: idStr, ...doc });
}

async function updateAppointment(appointmentId, updates) {
  const col = getCollection(COLLECTION);
  const payload = stripUndefined({ ...updates, updatedAt: new Date().toISOString() });
  await col.updateOne({ _id: appointmentId }, { $set: payload });
}

async function deleteAppointment(appointmentId) {
  const col = getCollection(COLLECTION);
  await col.deleteOne({ _id: appointmentId });
}

async function listAppointmentsByUser(userEmail, options = {}) {
  const col = getCollection(COLLECTION);
  const { status, startDate, endDate, limit: limitCount } = options;
  const filter = { userEmail: userEmail || '' };
  if (status) filter.status = status;
  if (startDate && endDate) {
    filter.scheduledDateTime = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    filter.scheduledDateTime = { $gte: startDate };
  } else if (endDate) {
    filter.scheduledDateTime = { $lte: endDate };
  }
  let cursor = col.find(filter).sort({ scheduledDateTime: 1 });
  if (limitCount != null) cursor = cursor.limit(limitCount);
  const docs = await cursor.toArray();
  return docs.map((d) => {
    const idStr = d._id instanceof ObjectId ? d._id.toString() : String(d._id || '');
    return sanitize({ appointmentId: idStr, ...d });
  }).filter(Boolean);
}

module.exports = {
  saveAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  listAppointmentsByUser,
  sanitize
};
