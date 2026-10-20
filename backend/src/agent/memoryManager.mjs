import { ShortTermMemory } from './memory/shortTermMemory.mjs';
import { LongTermMemory } from './memory/longTermMemory.mjs';
import { EpisodicMemory } from './memory/episodicMemory.mjs';

export class MemoryManager {
  constructor({ chatSessionRepo, userBasicInfoRepo, agentMemoryRepo, patientProfileRepo } = {}) {
    this.shortTerm = new ShortTermMemory();
    this.chatSessionRepo = chatSessionRepo || null;
    this.userBasicInfoRepo = userBasicInfoRepo || null;
    this.longTerm = new LongTermMemory({ agentMemoryRepo });
    this.episodic = new EpisodicMemory({ patientProfileRepo });
    this._hydrated = new Set();
  }

  async getRecentMessages(userId, sessionId, limit = 20) {
    const cached = this.shortTerm.getRecentMessages(userId, sessionId, limit);
    if (cached.length > 0) return cached;

    if (this.chatSessionRepo && !this._hydrated.has(`${userId}:${sessionId}`)) {
      this._hydrated.add(`${userId}:${sessionId}`);
      try {
        const result = await this.chatSessionRepo.getLatestSession(userId);
        if (result && result.session && result.session.messages) {
          for (const msg of result.session.messages) {
            this.shortTerm.append(userId, sessionId, msg.role, msg.content);
          }
          return this.shortTerm.getRecentMessages(userId, sessionId, limit);
        }
      } catch (err) {
        console.warn('⚠️ MemoryManager hydration failed:', err.message);
      }
    }

    return cached;
  }

  appendToSession(userId, sessionId, role, content) {
    this.shortTerm.append(userId, sessionId, role, content);
  }

  async loadPatientProfile(userId) {
    const [basicInfo, episodicProfile] = await Promise.all([
      this._loadBasicInfo(userId),
      this.episodic.getProfile(userId),
    ]);

    if (!basicInfo && !episodicProfile) return null;

    return {
      ...(basicInfo || {}),
      ...(episodicProfile || {}),
    };
  }

  async _loadBasicInfo(userId) {
    if (!this.userBasicInfoRepo) return null;
    try {
      const info = await this.userBasicInfoRepo.getBasicInfo(userId);
      if (!info) return null;
      return {
        basicInfo: info.basicInfo || null,
        medicalHistory: info.medicalHistory || null,
        familyHistory: info.familyHistory || null,
        allergies: info.allergies || null,
      };
    } catch (err) {
      console.warn('⚠️ loadPatientProfile failed:', err.message);
      return null;
    }
  }

  async searchRelevant(query, userId, limit = 5) {
    return this.longTerm.search(query, userId, limit);
  }

  async summarizeAndClear(userId, sessionId) {
    const messages = this.shortTerm.getMessages(userId, sessionId);

    if (messages.length > 0) {
      await Promise.all([
        this.longTerm.extractAndStore(userId, sessionId, messages),
        this.episodic.updateFromConversation(userId, messages),
      ]);
    }

    this.clearUserSessions(userId);
  }

  clearUserSessions(userId) {
    this.shortTerm.clearByUser(userId);
    for (const key of this._hydrated) {
      if (key.startsWith(`${userId}:`)) {
        this._hydrated.delete(key);
      }
    }
  }
}
