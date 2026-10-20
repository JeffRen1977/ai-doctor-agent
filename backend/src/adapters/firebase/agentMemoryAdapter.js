/**
 * Firebase Adapter: AgentMemory
 * Collection: agent_memories (root-level)
 */
const crypto = require('crypto');
const {
  doc, setDoc, getDoc, getDocs, deleteDoc,
  collection, query, where, orderBy, limit: fbLimit,
} = require('firebase/firestore');
const { db } = require('../../config/firebase');
const { tokenize, rankMemories } = require('../memorySearch');

const COLLECTION = 'agent_memories';
const SEARCH_POOL_SIZE = 200;

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
  const contentHash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 32);
  const ref = doc(db, COLLECTION, `${userId}_${contentHash}`);
  const existing = await getDoc(ref);
  const fields = {
    userId, type, content, importance,
    sourceSessionId: sourceSessionId || null,
    metadata: metadata || {},
    updatedAt: now,
  };
  if (!existing.exists()) {
    fields.accessCount = 0;
    fields.createdAt = now;
  }
  await setDoc(ref, fields, { merge: true });
}

async function findByUser(userId, { type, limit: maxResults = 20 } = {}) {
  const constraints = [where('userId', '==', userId)];
  if (type) constraints.push(where('type', '==', type));
  constraints.push(orderBy('importance', 'desc'), fbLimit(maxResults));
  const q = query(collection(db, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(normalize);
}

async function search(userId, queryStr, limit = 5) {
  if (tokenize(queryStr).length === 0) return [];
  const candidates = await findByUser(userId, { limit: SEARCH_POOL_SIZE });
  return rankMemories(candidates, queryStr, limit);
}

async function deleteByUser(userId) {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  const deletes = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletes);
}

module.exports = { save, findByUser, search, deleteByUser };
