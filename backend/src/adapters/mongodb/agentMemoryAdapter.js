const { getCollection } = require('./connection');
const { tokenize, rankMemories } = require('../memorySearch');

const COLLECTION = 'agent_memories';
const SEARCH_POOL_SIZE = 200;

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

async function search(userId, query, limit = 5) {
  if (tokenize(query).length === 0) return [];
  const candidates = await findByUser(userId, { limit: SEARCH_POOL_SIZE });
  return rankMemories(candidates, query, limit);
}

async function deleteByUser(userId) {
  const col = getCollection(COLLECTION);
  await col.deleteMany({ userId });
}

module.exports = { save, findByUser, search, deleteByUser };
