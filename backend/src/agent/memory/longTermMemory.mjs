const CONCLUSION_RE = /诊断|建议|可能是|注意|需要|应该|recommend|suggest|diagnos|should|consider/i;
const PREFERENCE_RE = /我不想|我更喜欢|我习惯|我希望|不要给我|prefer|don't want|i like/i;
const MIN_SUMMARY_LENGTH = 50;

export class LongTermMemory {
  constructor({ agentMemoryRepo } = {}) {
    this.repo = agentMemoryRepo || null;
  }

  async search(query, userId, limit = 5) {
    if (!this.repo) return [];
    try {
      return await this.repo.search(userId, query, limit);
    } catch (err) {
      console.warn('⚠️ LongTermMemory.search failed:', err.message);
      return [];
    }
  }

  async store(userId, { type, content, importance = 0.5, sourceSessionId }) {
    if (!this.repo) return;
    await this.repo.save(userId, { type, content, importance, sourceSessionId });
  }

  async extractAndStore(userId, sessionId, messages) {
    if (!this.repo || !messages || messages.length === 0) return;

    const toStore = [];

    for (const msg of messages) {
      if (msg.role === 'assistant' && CONCLUSION_RE.test(msg.content)) {
        toStore.push({ type: 'conclusion', content: msg.content, importance: 0.7 });
      }
      if (msg.role === 'user' && PREFERENCE_RE.test(msg.content)) {
        toStore.push({ type: 'preference', content: msg.content, importance: 0.6 });
      }
    }

    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant' && last.content.length > MIN_SUMMARY_LENGTH) {
      const alreadyStored = toStore.some(m => m.content === last.content);
      if (!alreadyStored) {
        toStore.push({ type: 'summary', content: last.content, importance: 0.4 });
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
