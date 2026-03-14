/**
 * MongoDB Adapter: ChatSession（与 firebase/chatSessionAdapter 同接口）
 * 独立集合 chat_sessions，文档含 userId、sessionId。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'chat_sessions';

function toDate(v) {
  return v && typeof v.toDate === 'function' ? v.toDate() : v;
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

async function getLatestSession(userId) {
  const col = getCollection(COLLECTION);
  const docs = await col
    .find({ userId: userId || '' })
    .sort({ lastMessageAt: -1 })
    .limit(1)
    .toArray();
  if (docs.length === 0) return null;
  const d = docs[0];
  const sessionId = d.sessionId || d._id;
  return { sessionId, session: toSessionShape({ id: sessionId, ...d }) };
}

async function getOrCreateSession(userId) {
  const existing = await getLatestSession(userId);
  if (existing) return existing;

  const col = getCollection(COLLECTION);
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
  await col.insertOne({
    sessionId,
    userId,
    startedAt: now,
    lastMessageAt: now,
    messages: [],
    updatedAt: now
  });
  return { sessionId, session };
}

async function appendMessage(userId, sessionId, role, content) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ userId: userId || '', sessionId });
  if (!doc) return;
  const messages = doc.messages || [];
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role: role === 'assistant' ? 'assistant' : 'user',
    content,
    timestamp: new Date()
  };
  messages.push(newMsg);
  const now = new Date();
  await col.updateOne(
    { userId: userId || '', sessionId },
    { $set: { messages, lastMessageAt: now, updatedAt: now } }
  );
}

async function getRecentTurnsForAgent(userId, maxTurns = 5) {
  const latest = await getLatestSession(userId);
  if (!latest) return '';
  return formatTurns(latest.session.messages, maxTurns);
}

async function clearLatestSession(userId) {
  const latest = await getLatestSession(userId);
  if (!latest) return;
  const col = getCollection(COLLECTION);
  const now = new Date();
  await col.updateOne(
    { userId: userId || '', sessionId: latest.sessionId },
    { $set: { messages: [], lastMessageAt: now, updatedAt: now } }
  );
}

module.exports = {
  getOrCreateSession,
  getLatestSession,
  appendMessage,
  getRecentTurnsForAgent,
  clearLatestSession,
  toSessionShape
};
