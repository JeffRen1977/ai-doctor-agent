/**
 * MongoDB Adapter: Notification（与 firebase/notificationAdapter 同接口）
 * 集合 notifications，insertOne 生成 id。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'notifications';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

async function addNotification(notification) {
  const col = getCollection(COLLECTION);
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
  const result = await col.insertOne(payload);
  const id = result.insertedId ? result.insertedId.toString() : '';
  return { id, ...payload };
}

module.exports = {
  addNotification
};
