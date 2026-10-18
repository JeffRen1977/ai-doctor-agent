import { ShortTermMemory } from './memory/shortTermMemory.mjs';

export class MemoryManager {
  constructor() {
    this.shortTerm = new ShortTermMemory();
  }

  getRecentMessages(sessionId, limit = 20) {
    return this.shortTerm.getRecentMessages(sessionId, limit);
  }

  appendToSession(sessionId, role, content) {
    this.shortTerm.append(sessionId, role, content);
  }

  async loadPatientProfile(_userId) {
    return null;
  }

  async searchRelevant(_query, _userId) {
    return [];
  }
}
