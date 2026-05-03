/**
 * Firebase Adapter: UserSettings
 * 读写 userSettings/{userId}，单文档 per user，merge 语义。
 */

const { doc, getDoc, setDoc, collection, query, where, getDocs, limit } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'userSettings';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.createdAt != null) out.createdAt = toPlainValue(out.createdAt) || out.createdAt;
  if (out.updatedAt != null) out.updatedAt = toPlainValue(out.updatedAt) || out.updatedAt;
  return out;
}

async function getUserSettings(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitize(snap.data());
}

async function setUserSettings(userId, data) {
  const ref = doc(db, COLLECTION, userId);
  await setDoc(ref, data, { merge: true });
}

/**
 * Find userSettings document id (userId) by bound Telegram chat_id.
 * @param {string|number} telegramChatId
 * @returns {Promise<string|null>}
 */
async function findUserIdByTelegramChatId(telegramChatId) {
  if (telegramChatId == null || telegramChatId === '') return null;
  const sid = String(telegramChatId);
  const ref = collection(db, COLLECTION);
  const q = query(ref, where('integrations.telegramChatId', '==', sid), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

module.exports = {
  getUserSettings,
  setUserSettings,
  findUserIdByTelegramChatId,
  sanitize
};
