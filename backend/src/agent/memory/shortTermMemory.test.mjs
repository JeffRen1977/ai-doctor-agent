import { describe, test, expect } from '@jest/globals';
import { ShortTermMemory } from './shortTermMemory.mjs';

describe('ShortTermMemory', () => {
  test('stores and retrieves messages with userId+sessionId key', () => {
    const mem = new ShortTermMemory();
    mem.append('u1', 's1', 'user', 'hello');
    mem.append('u1', 's1', 'assistant', 'hi');
    expect(mem.getMessages('u1', 's1')).toHaveLength(2);
    expect(mem.getMessages('u1', 's1')[0]).toEqual({ role: 'user', content: 'hello' });
  });

  test('getRecentMessages respects limit', () => {
    const mem = new ShortTermMemory();
    for (let i = 0; i < 30; i++) {
      mem.append('u1', 's1', 'user', `msg ${i}`);
    }
    expect(mem.getRecentMessages('u1', 's1', 5)).toHaveLength(5);
    expect(mem.getRecentMessages('u1', 's1', 5)[0].content).toBe('msg 25');
  });

  test('clear removes session', () => {
    const mem = new ShortTermMemory();
    mem.append('u1', 's1', 'user', 'hello');
    mem.clear('u1', 's1');
    expect(mem.getMessages('u1', 's1')).toHaveLength(0);
  });

  test('returns empty array for unknown session', () => {
    const mem = new ShortTermMemory();
    expect(mem.getMessages('u1', 'unknown')).toEqual([]);
  });

  test('isolates by userId even with same sessionId', () => {
    const mem = new ShortTermMemory();
    mem.append('userA', 's1', 'user', 'a-secret');
    mem.append('userB', 's1', 'user', 'b-secret');
    expect(mem.getMessages('userA', 's1')).toHaveLength(1);
    expect(mem.getMessages('userB', 's1')).toHaveLength(1);
    expect(mem.getMessages('userA', 's1')[0].content).toBe('a-secret');
    expect(mem.getMessages('userB', 's1')[0].content).toBe('b-secret');
  });

  test('throws when userId is missing', () => {
    const mem = new ShortTermMemory();
    expect(() => mem.append('', 's1', 'user', 'msg')).toThrow('userId is required');
    expect(() => mem.append(null, 's1', 'user', 'msg')).toThrow('userId is required');
  });

  test('enforces max messages per session', () => {
    const mem = new ShortTermMemory({ maxMessages: 3 });
    for (let i = 0; i < 5; i++) {
      mem.append('u1', 's1', 'user', `msg ${i}`);
    }
    const msgs = mem.getMessages('u1', 's1');
    expect(msgs).toHaveLength(3);
    expect(msgs[0].content).toBe('msg 2');
  });

  test('expires sessions after TTL', () => {
    const mem = new ShortTermMemory({ ttlMs: 50 });
    mem.append('u1', 's1', 'user', 'hello');
    const entry = mem.sessions.get('u1:s1');
    entry.lastAccess = Date.now() - 100;
    expect(mem.getMessages('u1', 's1')).toHaveLength(0);
  });

  test('purgeExpired removes stale sessions', () => {
    const mem = new ShortTermMemory({ ttlMs: 50 });
    mem.append('u1', 's1', 'user', 'hello');
    mem.append('u1', 's2', 'user', 'world');
    const entry = mem.sessions.get('u1:s1');
    entry.lastAccess = Date.now() - 100;
    mem.purgeExpired();
    expect(mem.sessions.size).toBe(1);
    expect(mem.sessions.has('u1:s2')).toBe(true);
  });
});
