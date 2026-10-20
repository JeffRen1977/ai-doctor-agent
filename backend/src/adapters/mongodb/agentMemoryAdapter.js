const { getCollection } = require('./connection');

const COLLECTION = 'agent_memories';

function normalize(doc) {
  if (!doc) return null;
  return {
    id: doc._id ? String(doc._id) : undefined,
    userId: doc.userId,
    type: doc.type,
    content: doc.content,
    importance: doc.importance ?? 0.5,
    accessCount: doc.accessCount ?? 0,
    sourceSessionId: doc.sourceSessionId || null,
    metadata: doc.metadata || {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function save(userId, { type, content, importance = 0.5, sourceSessionId, metadata }) {
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();
  await col.updateOne(
    { userId, content },
    {
      $set: { type, importance, sourceSessionId, metadata, updatedAt: now },
      $setOnInsert: { userId, content, accessCount: 0, createdAt: now },
    },
    { upsert: true },
  );
}

async function findByUser(userId, { type, limit = 20 } = {}) {
  const col = getCollection(COLLECTION);
  const filter = { userId };
  if (type) filter.type = type;
  const docs = await col.find(filter)
    .sort({ importance: -1, updatedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(normalize);
}

function tokenize(query) {
  return query
    .toLowerCase()
    .split(/[\s,，。？！?!;；：:]+/)
    .filter(t => t.length >= 2);
}

function timeDecay(dateStr) {
  const age = Date.now() - new Date(dateStr).getTime();
  const days = age / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - days / 180);
}

async function search(userId, query, limit = 5) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const col = getCollection(COLLECTION);
  const orClauses = tokens.map(t => ({ content: { $regex: t, $options: 'i' } }));
  const docs = await col.find({ userId, $or: orClauses }).toArray();

  const scored = docs.map(doc => {
    const lower = (doc.content || '').toLowerCase();
    const matchCount = tokens.filter(t => lower.includes(t)).length;
    const score = (matchCount / tokens.length) * 0.5
      + (doc.importance || 0.5) * 0.3
      + timeDecay(doc.updatedAt || doc.createdAt) * 0.2;
    return { ...normalize(doc), score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

async function deleteByUser(userId) {
  const col = getCollection(COLLECTION);
  await col.deleteMany({ userId });
}

module.exports = { save, findByUser, search, deleteByUser };
