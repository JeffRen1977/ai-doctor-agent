const CONCLUSION_RE = /可能是|考虑为|诊断为|初步判断|提示.{0,4}(?:风险|异常)|建议.{0,15}(?:就医|就诊|检查|复查|服用|停用|停药|调整|监测|减少|增加|避免)|likely (?:due to|caused by)|diagnos|recommend (?:that )?you|you should (?:see|get|take|stop|avoid|monitor)/i;
const PREFERENCE_RE = /我不想|我更喜欢|我习惯|我希望|不要给我|prefer|don't want|i like/i;
const MAX_CONCLUSION_LENGTH = 500;
const MAX_PREFERENCE_LENGTH = 200;

export class LongTermMemory {
  constructor({ agentMemoryRepo, embedFn } = {}) {
    this.repo = agentMemoryRepo || null;
    this._embedFn = embedFn || null;
  }

  async generateEmbedding(text) {
    if (!text) return null;
    try {
      let fn = this._embedFn;
      if (!fn) {
        const { embed } = await import('ai');
        const { getEmbeddingModel } = await import('../config/agentProvider.mjs');
        fn = (opts) => embed({ model: getEmbeddingModel(), ...opts });
      }
      const result = await fn({ value: text.slice(0, 8000) });
      return result.embedding;
    } catch (err) {
      console.warn('⚠️ LongTermMemory.generateEmbedding failed:', err.message);
      return null;
    }
  }

  async search(query, userId, limit = 5) {
    if (!this.repo) return [];
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      return await this.repo.search(userId, query, limit, queryEmbedding);
    } catch (err) {
      console.warn('⚠️ LongTermMemory.search failed:', err.message);
      return [];
    }
  }

  async store(userId, { type, content, importance = 0.5, sourceSessionId }) {
    if (!this.repo) return;
    const embedding = await this.generateEmbedding(content);
    await this.repo.save(userId, { type, content, importance, sourceSessionId, embedding });
  }

  async extractAndStore(userId, sessionId, messages) {
    if (!this.repo || !messages || messages.length === 0) return;

    const toStore = [];

    for (const msg of messages) {
      const content = msg.content || '';
      if (msg.role === 'assistant' && CONCLUSION_RE.test(content)) {
        toStore.push({ type: 'conclusion', content: content.slice(0, MAX_CONCLUSION_LENGTH), importance: 0.7 });
      }
      if (msg.role === 'user' && PREFERENCE_RE.test(content)) {
        toStore.push({ type: 'preference', content: content.slice(0, MAX_PREFERENCE_LENGTH), importance: 0.6 });
      }
    }

    for (const mem of toStore) {
      try {
        await this.store(userId, { ...mem, sourceSessionId: sessionId });
      } catch (err) {
        console.warn('⚠️ LongTermMemory.extractAndStore failed for one entry:', err.message);
      }
    }
  }
}
