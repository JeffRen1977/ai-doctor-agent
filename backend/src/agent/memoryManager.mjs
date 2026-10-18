import { ShortTermMemory } from './memory/shortTermMemory.mjs';

export class MemoryManager {
  constructor() {
    this.shortTerm = new ShortTermMemory();
  }

  getRecentMessages(userId, sessionId, limit = 20) {
    return this.shortTerm.getRecentMessages(userId, sessionId, limit);
  }

  appendToSession(userId, sessionId, role, content) {
    this.shortTerm.append(userId, sessionId, role, content);
  }

  async loadPatientProfile(_userId) {
    return null;
  }

  async searchRelevant(_query, _userId) {
    return [];
  }
}
