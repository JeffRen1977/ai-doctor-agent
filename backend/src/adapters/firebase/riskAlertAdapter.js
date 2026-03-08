/**
 * Firebase Adapter: RiskAlert
 * 读写 riskAlerts 集合；addDoc 生成 id；查询 by userEmail + orderBy timestamp；update 用于 acknowledge。
 * 仅依赖 config/firebase，不依赖 services 或 routes.
 */

const { doc, collection, addDoc, getDocs, updateDoc, query, where, orderBy, limit } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'riskAlerts';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function docToAlert(docSnap) {
  const data = docSnap.data();
  if (!data) return null;
  return {
    id: docSnap.id,
    userEmail: data.userEmail,
    alertType: data.alertType,
    severity: data.severity,
    details: data.details || {},
    timestamp: toPlainValue(data.timestamp) || '',
    acknowledged: !!data.acknowledged,
    acknowledgedAt: toPlainValue(data.acknowledgedAt) || null,
    action: data.action || null
  };
}

/**
 * @param {Object} alert - { userEmail, alertType, severity, details?, timestamp?, acknowledged?, action? }
 * @returns {Promise<{ id: string, ...alert }>}
 */
async function addAlert(alert) {
  const ref = collection(db, COLLECTION);
  const now = new Date().toISOString();
  const payload = {
    userEmail: alert.userEmail ?? '',
    alertType: alert.alertType ?? '',
    severity: alert.severity ?? 'medium',
    details: alert.details ?? {},
    timestamp: toPlainValue(alert.timestamp) ?? now,
    acknowledged: alert.acknowledged ?? false,
    action: alert.action ?? null
  };
  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

/**
 * @param {string} userEmail
 * @param {number} limitCount
 * @returns {Promise<Array<{ id, userEmail, alertType, severity, ... }>>}
 */
async function getRecentAlertsByUser(userEmail, limitCount = 20) {
  const alertsRef = collection(db, COLLECTION);
  try {
    const q = query(
      alertsRef,
      where('userEmail', '==', userEmail),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToAlert).filter(Boolean);
  } catch (indexError) {
    if (indexError.code === 'failed-precondition') {
      console.warn('⚠️ RiskAlerts index not found, using fallback query');
      const fallbackQuery = query(alertsRef, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(fallbackQuery);
      const alerts = snapshot.docs.map(docToAlert).filter(Boolean);
      alerts.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      return alerts.slice(0, limitCount);
    }
    throw indexError;
  }
}

/**
 * @param {string} alertId
 * @param {Object} payload - e.g. { acknowledged: true, acknowledgedAt: string }
 */
async function acknowledgeAlert(alertId, payload) {
  const ref = doc(db, COLLECTION, alertId);
  const update = { ...payload };
  if (update.acknowledgedAt && typeof update.acknowledgedAt !== 'string') {
    update.acknowledgedAt = toPlainValue(update.acknowledgedAt) || new Date().toISOString();
  }
  await updateDoc(ref, update);
}

module.exports = {
  addAlert,
  getRecentAlertsByUser,
  acknowledgeAlert,
  docToAlert
};
