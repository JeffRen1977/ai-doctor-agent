/**
 * Firebase Adapter: Conversation（遗留对话，只读）
 * 查询 conversations 集合：by userEmail、orderBy updatedAt、limit。
 * 仅依赖 config/firebase，不依赖 services 或 routes.
 */

const { collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
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
    updatedAt: toPlainValue(data.updatedAt) || data.updatedAt
  };
}

/**
 * @param {string} userEmail
 * @param {number} limitCount
 * @returns {Promise<Array<{ conversationId, userEmail, updatedAt, ... }>>}
 */
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

module.exports = {
  getActiveConversationsByUser,
  docToConversation
};
