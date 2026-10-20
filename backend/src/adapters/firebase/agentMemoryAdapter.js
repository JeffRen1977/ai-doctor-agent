/**
 * Firebase Adapter: AgentMemory
 * Collection: agent_memories (root-level)
 */
const {
  doc, setDoc, getDocs, deleteDoc,
  collection, query, where, orderBy, limit: fbLimit,
} = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'agent_memories';

function normalize(snap) {
  const d = snap.data();
  return {
    id: snap.id,
    userId: d.userId,
    type: d.type,
    content: d.content,
    importance: d.importance ?? 0.5,
    accessCount: d.accessCount ?? 0,
    sourceSessionId: d.sourceSessionId || null,
    metadata: d.metadata || {},
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

async function save(userId, { type, content, importance = 0.5, sourceSessionId, metadata }) {
  const now = new Date().toISOString();
  const id = `${userId}_${Buffer.from(content).toString('base64url').slice(0, 32)}`;
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, {
    userId, type, content, importance,
    sourceSessionId: sourceSessionId || null,
    metadata: metadata || {},
    accessCount: 0,
    createdAt: now, updatedAt: now,
  }, { merge: true });
}

async function findByUser(userId, { type, limit: maxResults = 20 } = {}) {
  const constraints = [where('userId', '==', userId)];
  if (type) constraints.push(where('type', '==', type));
  constraints.push(orderBy('importance', 'desc'), fbLimit(maxResults));
  const q = query(collection(db, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
}

function tokenize(q) {
  return q.toLowerCase().split(/[\s,，。？！?!;；：:]+/).filter(t => t.length >= 2);
}

function timeDecay(dateStr) {
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - days / 180);
}

async function search(userId, queryStr, limit = 5) {
  const tokens = tokenize(queryStr);
  if (tokens.length === 0) return [];
  const all = await findByUser(userId, { limit: 100 });
  const scored = all.map(m => {
    const lower = (m.content || '').toLowerCase();
    const matchCount = tokens.filter(t => lower.includes(t)).length;
    if (matchCount === 0) return null;
    const score = (matchCount / tokens.length) * 0.5
      + (m.importance || 0.5) * 0.3
      + timeDecay(m.updatedAt || m.createdAt) * 0.2;
    return { ...m, score };
  }).filter(Boolean);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

async function deleteByUser(userId) {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  const deletes = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletes);
}

module.exports = { save, findByUser, search, deleteByUser };
