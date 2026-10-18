export class ShortTermMemory {
  constructor() {
    this.sessions = new Map();
  }

  getMessages(sessionId) {
    return this.sessions.get(sessionId) || [];
  }

  append(sessionId, role, content) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    this.sessions.get(sessionId).push({ role, content });
  }

  getRecentMessages(sessionId, limit = 20) {
    const msgs = this.getMessages(sessionId);
    return msgs.slice(-limit);
  }

  clear(sessionId) {
    this.sessions.delete(sessionId);
  }
}
