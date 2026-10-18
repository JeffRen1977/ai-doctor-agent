import { describe, test, expect } from '@jest/globals';
import { ShortTermMemory } from './shortTermMemory.mjs';

describe('ShortTermMemory', () => {
  test('stores and retrieves messages', () => {
    const mem = new ShortTermMemory();
    mem.append('s1', 'user', 'hello');
    mem.append('s1', 'assistant', 'hi');
    expect(mem.getMessages('s1')).toHaveLength(2);
    expect(mem.getMessages('s1')[0]).toEqual({ role: 'user', content: 'hello' });
  });

  test('getRecentMessages respects limit', () => {
    const mem = new ShortTermMemory();
    for (let i = 0; i < 30; i++) {
      mem.append('s1', 'user', `msg ${i}`);
    }
    expect(mem.getRecentMessages('s1', 5)).toHaveLength(5);
    expect(mem.getRecentMessages('s1', 5)[0].content).toBe('msg 25');
  });

  test('clear removes session', () => {
    const mem = new ShortTermMemory();
    mem.append('s1', 'user', 'hello');
    mem.clear('s1');
    expect(mem.getMessages('s1')).toHaveLength(0);
  });

  test('returns empty array for unknown session', () => {
    const mem = new ShortTermMemory();
    expect(mem.getMessages('unknown')).toEqual([]);
  });

  test('isolates sessions', () => {
    const mem = new ShortTermMemory();
    mem.append('s1', 'user', 'a');
    mem.append('s2', 'user', 'b');
    expect(mem.getMessages('s1')).toHaveLength(1);
    expect(mem.getMessages('s2')).toHaveLength(1);
    expect(mem.getMessages('s1')[0].content).toBe('a');
  });
});
