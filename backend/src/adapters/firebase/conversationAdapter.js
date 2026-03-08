/**
 * Firebase Adapter: Conversation
 * 读写 conversations 集合：getActiveConversationsByUser（userContext）；save/get/list/update/delete（conversationService）。
 */

const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'conversations';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function docToConversation(docSnap) {
  const data = docSnap.data();
  if (!data) return null;
  return {
    conversationId: docSnap.id,
    ...data,
    updatedAt: toPlainValue(data.updatedAt) || data.updatedAt,
    createdAt: data.createdAt != null ? toPlainValue(data.createdAt) || data.createdAt : data.createdAt
  };
}

function sanitizeConversation(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.updatedAt != null) out.updatedAt = toPlainValue(out.updatedAt) || out.updatedAt;
  if (out.createdAt != null) out.createdAt = toPlainValue(out.createdAt) || out.createdAt;
  return out;
}

async function getActiveConversationsByUser(userEmail, limitCount = 5) {
  const ref = collection(db, COLLECTION);
  try {
    const q = query(
      ref,
      where('userEmail', '==', userEmail),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToConversation).filter(Boolean);
  } catch (indexError) {
    if (indexError.code === 'failed-precondition') {
      console.warn('⚠️ Conversations index not found, using fallback');
      const fallbackQuery = query(ref, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(fallbackQuery);
      const list = snapshot.docs.map(docToConversation).filter(Boolean);
      list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      return list.slice(0, limitCount);
    }
    throw indexError;
  }
}

async function saveConversation(conversation) {
  const ref = doc(db, COLLECTION, conversation.conversationId);
  await setDoc(ref, conversation);
}

async function getConversation(conversationId) {
  const ref = doc(db, COLLECTION, conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitizeConversation({ conversationId: snap.id, ...snap.data() });
}

async function listByUser(userEmail, limitCount = 20) {
  const ref = collection(db, COLLECTION);
  try {
    const q = query(
      ref,
      where('userEmail', '==', userEmail),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sanitizeConversation({ conversationId: d.id, ...d.data() })).filter(Boolean);
  } catch (indexError) {
    if (indexError.code === 'failed-precondition') {
      const fallbackQuery = query(ref, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(fallbackQuery);
      let list = snapshot.docs.map((d) => sanitizeConversation({ conversationId: d.id, ...d.data() })).filter(Boolean);
      list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      return list.slice(0, limitCount);
    }
    throw indexError;
  }
}

async function updateConversation(conversationId, updates) {
  const ref = doc(db, COLLECTION, conversationId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
}

async function deleteConversation(conversationId) {
  const ref = doc(db, COLLECTION, conversationId);
  await deleteDoc(ref);
}

module.exports = {
  getActiveConversationsByUser,
  saveConversation,
  getConversation,
  listByUser,
  updateConversation,
  deleteConversation,
  docToConversation,
  sanitizeConversation
};
