/**
 * MongoDB Adapter: RiskAlert（与 firebase/riskAlertAdapter 同接口）
 * 集合 riskAlerts；addAlert 生成 id；查询 by userEmail + sort timestamp；acknowledge 用 updateOne。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'riskAlerts';

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

function docToAlert(doc) {
  if (!doc) return null;
  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return {
    id,
    userEmail: doc.userEmail ?? '',
    alertType: doc.alertType ?? '',
    severity: doc.severity ?? 'medium',
    details: doc.details ?? {},
    timestamp: toPlainValue(doc.timestamp) || '',
    acknowledged: !!doc.acknowledged,
    acknowledgedAt: toPlainValue(doc.acknowledgedAt) || null,
    action: doc.action ?? null
  };
}

/**
 * @param {Object} alert - { userEmail, alertType, severity, details?, timestamp?, acknowledged?, action? }
 * @returns {Promise<{ id: string, ... }>}
 */
async function addAlert(alert) {
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();
  const payload = stripUndefined({
    userEmail: alert.userEmail ?? '',
    alertType: alert.alertType ?? '',
    severity: alert.severity ?? 'medium',
    details: alert.details ?? {},
    timestamp: toPlainValue(alert.timestamp) ?? now,
    acknowledged: alert.acknowledged ?? false,
    action: alert.action ?? null
  });
  const result = await col.insertOne(payload);
  const id = result.insertedId ? result.insertedId.toString() : '';
  return { id, ...payload };
}

/**
 * @param {string} userEmail
 * @param {number} limitCount
 * @returns {Promise<Array<{ id, userEmail, alertType, severity, ... }>>}
 */
async function getRecentAlertsByUser(userEmail, limitCount = 20) {
  const col = getCollection(COLLECTION);
  const cursor = col
    .find({ userEmail: userEmail || '' })
    .sort({ timestamp: -1 })
    .limit(limitCount);
  const docs = await cursor.toArray();
  return docs.map(docToAlert).filter(Boolean);
}

/**
 * @param {string} alertId
 * @param {Object} payload - e.g. { acknowledged: true, acknowledgedAt: string }
 */
async function acknowledgeAlert(alertId, payload) {
  const col = getCollection(COLLECTION);
  const update = { ...payload };
  if (update.acknowledgedAt != null && typeof update.acknowledgedAt !== 'string') {
    update.acknowledgedAt = toPlainValue(update.acknowledgedAt) || new Date().toISOString();
  }
  const filter = ObjectId.isValid(alertId) && String(alertId).length === 24
    ? { _id: new ObjectId(alertId) }
    : { _id: alertId };
  await col.updateOne(filter, { $set: stripUndefined(update) });
}

module.exports = {
  addAlert,
  getRecentAlertsByUser,
  acknowledgeAlert,
  docToAlert
};
