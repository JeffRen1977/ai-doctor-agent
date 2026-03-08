/**
 * Firebase Adapter: ChatHistory
 * 读写 chatHistory 集合；doc id 通常为 userEmail，或 addDocument 自动生成。
 */

const { doc, getDoc, setDoc, collection, addDoc, getDocs } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'chatHistory';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  ['createdAt', 'updatedAt', 'lastActivity', 'deletedAt'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  if (out.messages && Array.isArray(out.messages)) {
    out.messages = out.messages.map((m) => {
      if (m && m.timestamp != null) return { ...m, timestamp: toPlainValue(m.timestamp) || m.timestamp };
      return m;
    });
  }
  return out;
}

async function addDocument(data) {
  const ref = collection(db, COLLECTION);
  const docRef = await addDoc(ref, data);
  return { id: docRef.id };
}

async function getDocument(id) {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitize({ id: snap.id, ...snap.data() });
}

async function listAll() {
  const ref = collection(db, COLLECTION);
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((d) => sanitize({ id: d.id, ...d.data() })).filter(Boolean);
}

async function getByUser(userEmail) {
  const ref = doc(db, COLLECTION, userEmail);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitize({ id: snap.id, ...snap.data() });
}

async function setByUser(userEmail, data) {
  const ref = doc(db, COLLECTION, userEmail);
  await setDoc(ref, data);
}

module.exports = {
  addDocument,
  getDocument,
  listAll,
  getByUser,
  setByUser,
  sanitize
};
