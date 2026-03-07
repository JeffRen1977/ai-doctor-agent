/**
 * Firebase Adapter: ChatSession
 * 子集合 personalHealthRecords/{userId}/chat_sessions/{sessionId}。
 * 仅依赖 config/firebase 与 models/chatSession。
 */

const {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} = require('firebase/firestore');
const { db } = require('../../config/firebase');
const { validateChatSession } = require('../../models/chatSession');

const ROOT_COLLECTION = 'personalHealthRecords';
const CHAT_SESSIONS_SUB = 'chat_sessions';

function toDate(v) {
  return v && typeof v.toDate === 'function' ? v.toDate() : v;
}

/**
 * 取最新会话（不创建）。无会话时返回 null。
 * @param {string} userId
 * @returns {Promise<{ sessionId: string, session: Object } | null>}
 */
async function getLatestSession(userId) {
  const sessionsRef = collection(db, ROOT_COLLECTION, userId, CHAT_SESSIONS_SUB);
  let snap;
  try {
    const q = query(
      sessionsRef,
      orderBy('lastMessageAt', 'desc'),
      limit(1)
    );
    snap = await getDocs(q);
  } catch (err) {
    if (err.code === 'failed-precondition') {
      const all = await getDocs(sessionsRef);
      const list = [];
      all.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const ta = (a.lastMessageAt && toDate(a.lastMessageAt)) || new Date(0);
        const tb = (b.lastMessageAt && toDate(b.lastMessageAt)) || new Date(0);
        return tb - ta;
      });
      if (list.length === 0) return null;
      const s = list[0];
      return { sessionId: s.id, session: toSessionShape(s) };
    }
    throw err;
  }
  if (!snap || snap.empty) return null;
  const d = snap.docs[0];
  return { sessionId: d.id, session: toSessionShape({ id: d.id, ...d.data() }) };
}

/**
 * @param {string} userId - 一般为 sanitized email
 * @returns {Promise<{ sessionId: string, session: Object }>}
 */
async function getOrCreateSession(userId) {
  const existing = await getLatestSession(userId);
  if (existing) return existing;

  const sessionId = `session_${Date.now()}`;
  const now = new Date();
  const session = {
    sessionId,
    userId,
    startedAt: now,
    lastMessageAt: now,
    messages: [],
    updatedAt: now
  };
  const ref = doc(db, ROOT_COLLECTION, userId, CHAT_SESSIONS_SUB, sessionId);
  await setDoc(ref, {
    sessionId,
    userId,
    startedAt: now,
    lastMessageAt: now,
    messages: [],
    updatedAt: now
  });
  return { sessionId, session };
}

function toSessionShape(data) {
  if (!data) return null;
  const messages = (data.messages || []).map((m) => ({
    id: m.id,
    role: m.role || m.sender || 'user',
    content: m.content || '',
    timestamp: m.timestamp ? toDate(m.timestamp) : undefined
  }));
  return {
    sessionId: data.sessionId || data.id,
    userId: data.userId,
    startedAt: data.startedAt ? toDate(data.startedAt) : undefined,
    lastMessageAt: data.lastMessageAt ? toDate(data.lastMessageAt) : undefined,
    messages,
    summary: data.summary,
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined
  };
}

/**
 * @param {string} userId
 * @param {string} sessionId
 * @param {string} role - 'user' | 'assistant'
 * @param {string} content
 */
async function appendMessage(userId, sessionId, role, content) {
  const ref = doc(db, ROOT_COLLECTION, userId, CHAT_SESSIONS_SUB, sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const messages = data.messages || [];
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role: role === 'assistant' ? 'assistant' : 'user',
    content,
    timestamp: new Date()
  };
  messages.push(newMsg);
  const now = new Date();
  await setDoc(
    ref,
    {
      messages,
      lastMessageAt: now,
      updatedAt: now
    },
    { merge: true }
  );
}

/**
 * 按 lastMessageAt 取最新会话，取尾 maxTurns 条格式化为 "User: ...\nAssistant: ..."
 * @param {string} userId
 * @param {number} maxTurns
 * @returns {Promise<string>}
 */
async function getRecentTurnsForAgent(userId, maxTurns = 5) {
  const sessionsRef = collection(db, ROOT_COLLECTION, userId, CHAT_SESSIONS_SUB);
  let snap;
  try {
    const q = query(
      sessionsRef,
      orderBy('lastMessageAt', 'desc'),
      limit(1)
    );
    snap = await getDocs(q);
  } catch (err) {
    if (err.code === 'failed-precondition') {
      const all = await getDocs(sessionsRef);
      const list = [];
      all.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const ta = (a.lastMessageAt && toDate(a.lastMessageAt)) || new Date(0);
        const tb = (b.lastMessageAt && toDate(b.lastMessageAt)) || new Date(0);
        return tb - ta;
      });
      if (list.length === 0) return '';
      const session = toSessionShape(list[0]);
      return formatTurns(session.messages, maxTurns);
    }
    throw err;
  }
  if (snap.empty) return '';
  const d = snap.docs[0];
  const session = toSessionShape({ id: d.id, ...d.data() });
  return formatTurns(session.messages, maxTurns);
}

function formatTurns(messages, maxTurns) {
  if (!messages || messages.length === 0) return '';
  const tail = messages.slice(-maxTurns);
  return tail
    .map((m) => {
      const label = m.role === 'assistant' ? 'Assistant' : 'User';
      return `${label}: ${(m.content || '').trim()}`;
    })
    .join('\n');
}

/**
 * 将最新会话的 messages 清空
 * @param {string} userId
 */
async function clearLatestSession(userId) {
  const latest = await getLatestSession(userId);
  if (!latest) return;
  const ref = doc(db, ROOT_COLLECTION, userId, CHAT_SESSIONS_SUB, latest.sessionId);
  const now = new Date();
  await setDoc(ref, { messages: [], lastMessageAt: now, updatedAt: now }, { merge: true });
}

module.exports = {
  getOrCreateSession,
  getLatestSession,
  appendMessage,
  getRecentTurnsForAgent,
  clearLatestSession,
  toSessionShape
};
