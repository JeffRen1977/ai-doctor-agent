/**
 * MongoDB Adapter: EmergencyAlert（与 firebase/emergencyAlertAdapter 同接口）
 * 集合 emergencyAlerts；_id = alertId；list by userEmail + filters。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'emergencyAlerts';

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
  ['timestamp', 'resolvedAt', 'createdAt', 'updatedAt'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  return out;
}

async function saveAlert(alert) {
  const col = getCollection(COLLECTION);
  const alertId = alert.alertId;
  const payload = stripUndefined({ ...alert });
  await col.updateOne(
    { _id: alertId },
    { $set: payload },
    { upsert: true }
  );
}

async function getAlert(alertId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: alertId });
  if (!doc) return null;
  const idStr = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return sanitize({ alertId: idStr, ...doc });
}

async function listByUser(userEmail, options = {}) {
  const col = getCollection(COLLECTION);
  const { status, severity, limit: limitCount } = options;
  const filter = { userEmail: userEmail || '' };
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  let cursor = col.find(filter).sort({ timestamp: -1 });
  if (limitCount != null) cursor = cursor.limit(limitCount);
  const docs = await cursor.toArray();
  return docs.map((d) => {
    const idStr = d._id instanceof ObjectId ? d._id.toString() : String(d._id || '');
    return sanitize({ alertId: idStr, ...d });
  }).filter(Boolean);
}

async function updateAlert(alertId, updates) {
  const col = getCollection(COLLECTION);
  const payload = stripUndefined({ ...updates, updatedAt: new Date().toISOString() });
  await col.updateOne({ _id: alertId }, { $set: payload });
}

module.exports = {
  saveAlert,
  getAlert,
  listByUser,
  updateAlert,
  sanitize
};
