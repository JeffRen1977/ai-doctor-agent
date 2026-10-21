/**
 * agent_memories 的关键词检索打分（MongoDB / Firebase 共用）。
 * 中文没有空格分词，按相邻两字（bigram）切分；英文/数字按单词切分。
 */

const STOP_TOKENS = new Set([
  '怎么', '什么', '为什', '可以', '一下', '最近', '现在', '是不', '不是', '有没', '没有',
  '这个', '那个', '我的', '我们', '你们', '应该', '需要', '如何', '请问', '一个', '还是',
  '因为', '所以', '如果', '但是', '感觉', '觉得', '知道', '么办', '怎样',
  'the', 'and', 'for', 'what', 'how', 'can', 'have', 'has', 'my', 'is', 'are', 'do', 'does',
  'should', 'with', 'about', 'this', 'that',
]);

function tokenize(text) {
  const lower = String(text || '').toLowerCase();
  const tokens = new Set();
  for (const word of lower.match(/[a-z0-9]{2,}/g) || []) {
    if (!STOP_TOKENS.has(word)) tokens.add(word);
  }
  for (const run of lower.match(/[\u4e00-\u9fff]+/g) || []) {
    for (let i = 0; i < run.length - 1; i++) {
      const bigram = run.slice(i, i + 2);
      if (!STOP_TOKENS.has(bigram)) tokens.add(bigram);
    }
  }
  return [...tokens];
}

function timeDecay(dateStr) {
  const time = new Date(dateStr).getTime();
  if (!Number.isFinite(time)) return 0;
  const days = (Date.now() - time) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - days / 180);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function rankMemories(memories, query, limit = 5, queryEmbedding = null) {
  const tokens = tokenize(query);
  const hasEmbedding = queryEmbedding && queryEmbedding.length > 0;

  const scored = [];
  for (const m of memories) {
    const lower = (m.content || '').toLowerCase();
    const matchCount = tokens.length > 0
      ? tokens.filter((t) => lower.includes(t)).length
      : 0;

    const semScore = hasEmbedding && m.embedding && m.embedding.length > 0
      ? cosineSimilarity(queryEmbedding, m.embedding)
      : 0;

    if (matchCount === 0 && semScore < 0.3) continue;

    let score;
    if (hasEmbedding && semScore > 0) {
      score = semScore * 0.4
        + (tokens.length > 0 ? (matchCount / tokens.length) * 0.2 : 0)
        + (m.importance ?? 0.5) * 0.2
        + timeDecay(m.updatedAt || m.createdAt) * 0.2;
    } else {
      score = (tokens.length > 0 ? (matchCount / tokens.length) * 0.5 : 0)
        + (m.importance ?? 0.5) * 0.3
        + timeDecay(m.updatedAt || m.createdAt) * 0.2;
    }

    scored.push({ ...m, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

module.exports = { tokenize, rankMemories, cosineSimilarity, timeDecay };
