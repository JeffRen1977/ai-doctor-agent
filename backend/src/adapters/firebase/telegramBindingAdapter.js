/**
 * Firebase: one-time Telegram bind codes (doc id = code string).
 */

const { doc, getDoc, setDoc, deleteDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'telegramBindingCodes';

/**
 * @param {string} code
 * @param {{ userId: string, expiresAt: string }} payload
 */
async function putBindingCode(code, payload) {
  if (!code) throw new Error('code required');
  const ref = doc(db, COLLECTION, String(code).toUpperCase());
  await setDoc(ref, {
    userId: payload.userId,
    expiresAt: payload.expiresAt,
    createdAt: new Date().toISOString()
  });
}

/**
 * @param {string} code
 * @returns {Promise<{ userId: string } | null>}
 */
async function takeBindingCode(code) {
  if (!code) return null;
  const id = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  await deleteDoc(ref);
  if (!data?.userId || !data?.expiresAt) return null;
  if (new Date(data.expiresAt) < new Date()) return null;
  return { userId: data.userId };
}

module.exports = {
  putBindingCode,
  takeBindingCode
};
