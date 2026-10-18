import { describe, test, expect } from '@jest/globals';
import { MemoryManager } from './memoryManager.mjs';

describe('MemoryManager', () => {
  test('delegates session messages to ShortTermMemory', () => {
    const mm = new MemoryManager();
    mm.appendToSession('s1', 'user', 'hello');
    mm.appendToSession('s1', 'assistant', 'hi');
    const msgs = mm.getRecentMessages('s1');
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toEqual({ role: 'user', content: 'hello' });
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
