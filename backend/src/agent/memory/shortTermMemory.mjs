const MAX_MESSAGES_PER_SESSION = 100;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export class ShortTermMemory {
  constructor({ maxMessages = MAX_MESSAGES_PER_SESSION, ttlMs = SESSION_TTL_MS } = {}) {
    this.sessions = new Map();
    this.maxMessages = maxMessages;
    this.ttlMs = ttlMs;
  }

  _key(userId, sessionId) {
    if (!userId) throw new Error('userId is required for session isolation');
    return `${userId}:${sessionId}`;
  }

  _getEntry(key) {
    const entry = this.sessions.get(key);
    if (!entry) return null;
    if (Date.now() - entry.lastAccess > this.ttlMs) {
      this.sessions.delete(key);
      return null;
    }
    entry.lastAccess = Date.now();
    return entry;
  }

  getMessages(userId, sessionId) {
    const entry = this._getEntry(this._key(userId, sessionId));
    return entry ? entry.messages : [];
  }

  append(userId, sessionId, role, content) {
    const key = this._key(userId, sessionId);
    let entry = this._getEntry(key);
    if (!entry) {
      entry = { messages: [], lastAccess: Date.now() };
      this.sessions.set(key, entry);
    }
    entry.messages.push({ role, content });
    if (entry.messages.length > this.maxMessages) {
      entry.messages = entry.messages.slice(-this.maxMessages);
    }
  }

  getRecentMessages(userId, sessionId, limit = 20) {
    const msgs = this.getMessages(userId, sessionId);
    return msgs.slice(-limit);
  }

  clear(userId, sessionId) {
    this.sessions.delete(this._key(userId, sessionId));
  }

  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.sessions) {
      if (now - entry.lastAccess > this.ttlMs) {
        this.sessions.delete(key);
      }
    }
  }
}
