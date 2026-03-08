/**
 * Firebase Adapter: Notification
 * 追加文档到 notifications 集合，addDoc 生成 id。
 * 仅依赖 config/firebase，不依赖 services 或 routes.
 */

const { collection, addDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'notifications';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

/**
 * 追加一条通知，返回含 id 的对象
 * @param {Object} notification - { userEmail, type, alertId?, title?, message?, timestamp?, read? }
 * @returns {Promise<{ id: string, userEmail, type, alertId, title, message, timestamp, read }>}
 */
async function addNotification(notification) {
  const ref = collection(db, COLLECTION);
  const now = new Date().toISOString();
  const payload = {
    userEmail: notification.userEmail ?? '',
    type: notification.type ?? '',
    alertId: notification.alertId ?? null,
    title: notification.title ?? null,
    message: notification.message ?? null,
    timestamp: toPlainValue(notification.timestamp) ?? now,
    read: notification.read ?? false
  };
  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

module.exports = {
  addNotification
};
