/**
 * Firebase Adapter: EmergencyAlert
 */

const { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'emergencyAlerts';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
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
  const ref = doc(db, COLLECTION, alert.alertId);
  await setDoc(ref, alert);
}

async function getAlert(alertId) {
  const ref = doc(db, COLLECTION, alertId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitize({ alertId: snap.id, ...snap.data() });
}

async function listByUser(userEmail, options = {}) {
  const { status, severity, limit: limitCount } = options;
  const ref = collection(db, COLLECTION);
  try {
    const constraints = [where('userEmail', '==', userEmail)];
    if (status) constraints.push(where('status', '==', status));
    if (severity) constraints.push(where('severity', '==', severity));
    constraints.push(orderBy('timestamp', 'desc'));
    if (limitCount != null) constraints.push(limit(limitCount));
    const q = query(ref, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sanitize({ alertId: d.id, ...d.data() })).filter(Boolean);
  } catch (e) {
    if (e.code === 'failed-precondition') {
      const q = query(ref, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(q);
      let list = snapshot.docs.map((d) => sanitize({ alertId: d.id, ...d.data() })).filter(Boolean);
      if (status) list = list.filter((a) => a.status === status);
      if (severity) list = list.filter((a) => a.severity === severity);
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (limitCount != null) list = list.slice(0, limitCount);
      return list;
    }
    throw e;
  }
}

async function updateAlert(alertId, updates) {
  const ref = doc(db, COLLECTION, alertId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
}

module.exports = {
  saveAlert,
  getAlert,
  listByUser,
  updateAlert,
  sanitize
};
