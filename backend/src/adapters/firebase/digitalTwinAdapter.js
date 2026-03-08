/**
 * Firebase Adapter: DigitalTwin
 * 读写 digitalTwins/{userId}，单文档 per user，merge 语义。userId 一般为 sanitized email。
 */

const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'digitalTwins';

function sanitizeUserId(userEmail) {
  return (userEmail || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.lastUpdated != null) out.lastUpdated = toPlainValue(out.lastUpdated) || out.lastUpdated;
  return out;
}

async function getDigitalTwin(userId) {
  const id = sanitizeUserId(userId);
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitize(snap.data());
}

async function setDigitalTwin(userId, data) {
  const id = sanitizeUserId(userId);
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, data, { merge: true });
}

module.exports = {
  getDigitalTwin,
  setDigitalTwin,
  sanitizeUserId,
  sanitize
};
