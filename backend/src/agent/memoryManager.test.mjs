import { describe, test, expect } from '@jest/globals';
import { MemoryManager } from './memoryManager.mjs';

describe('MemoryManager', () => {
  test('delegates session messages with userId isolation', () => {
    const mm = new MemoryManager();
    mm.appendToSession('u1', 's1', 'user', 'hello');
    mm.appendToSession('u1', 's1', 'assistant', 'hi');
    const msgs = mm.getRecentMessages('u1', 's1');
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toEqual({ role: 'user', content: 'hello' });
  });

  test('different users with same sessionId are isolated', () => {
    const mm = new MemoryManager();
    mm.appendToSession('u1', 's1', 'user', 'private-u1');
    mm.appendToSession('u2', 's1', 'user', 'private-u2');
    expect(mm.getRecentMessages('u1', 's1')).toHaveLength(1);
    expect(mm.getRecentMessages('u2', 's1')).toHaveLength(1);
    expect(mm.getRecentMessages('u1', 's1')[0].content).toBe('private-u1');
  });

  test('loadPatientProfile returns null (stub for Phase 4)', async () => {
    const mm = new MemoryManager();
    expect(await mm.loadPatientProfile('u1')).toBeNull();
  });

  test('searchRelevant returns empty (stub for Phase 4)', async () => {
    const mm = new MemoryManager();
    expect(await mm.searchRelevant('test', 'u1')).toEqual([]);
  });
});
