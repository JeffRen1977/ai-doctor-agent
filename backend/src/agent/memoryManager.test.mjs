import { describe, test, expect } from '@jest/globals';
import { MemoryManager } from './memoryManager.mjs';

describe('MemoryManager', () => {
  test('delegates session messages with userId isolation', async () => {
    const mm = new MemoryManager();
    mm.appendToSession('u1', 's1', 'user', 'hello');
    mm.appendToSession('u1', 's1', 'assistant', 'hi');
    const msgs = await mm.getRecentMessages('u1', 's1');
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toEqual({ role: 'user', content: 'hello' });
  });

  test('different users with same sessionId are isolated', async () => {
    const mm = new MemoryManager();
    mm.appendToSession('u1', 's1', 'user', 'private-u1');
    mm.appendToSession('u2', 's1', 'user', 'private-u2');
    expect(await mm.getRecentMessages('u1', 's1')).toHaveLength(1);
    expect(await mm.getRecentMessages('u2', 's1')).toHaveLength(1);
    expect((await mm.getRecentMessages('u1', 's1'))[0].content).toBe('private-u1');
  });

  test('loadPatientProfile returns null without repo', async () => {
    const mm = new MemoryManager();
    expect(await mm.loadPatientProfile('u1')).toBeNull();
  });

  test('searchRelevant returns empty', async () => {
    const mm = new MemoryManager();
    expect(await mm.searchRelevant('test', 'u1')).toEqual([]);
  });

  test('hydrates from chatSessionRepo when in-memory is empty', async () => {
    const mockRepo = {
      getLatestSession: async () => ({
        sessionId: 's1',
        session: {
          messages: [
            { role: 'user', content: 'persisted question' },
            { role: 'assistant', content: 'persisted answer' },
          ],
        },
      }),
    };
    const mm = new MemoryManager({ chatSessionRepo: mockRepo });
    const msgs = await mm.getRecentMessages('u1', 's1');
    expect(msgs).toHaveLength(2);
    expect(msgs[0].content).toBe('persisted question');
    expect(msgs[1].content).toBe('persisted answer');
  });

  test('does not re-hydrate after first hydration attempt', async () => {
    let callCount = 0;
    const mockRepo = {
      getLatestSession: async () => {
        callCount++;
        return null;
      },
    };
    const mm = new MemoryManager({ chatSessionRepo: mockRepo });
    await mm.getRecentMessages('u1', 's1');
    await mm.getRecentMessages('u1', 's1');
    expect(callCount).toBe(1);
  });

  test('prefers in-memory cache over persisted data', async () => {
    const mockRepo = {
      getLatestSession: async () => ({
        sessionId: 's1',
        session: { messages: [{ role: 'user', content: 'old' }] },
      }),
    };
    const mm = new MemoryManager({ chatSessionRepo: mockRepo });
    mm.appendToSession('u1', 's1', 'user', 'new');
    const msgs = await mm.getRecentMessages('u1', 's1');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('new');
  });

  test('loadPatientProfile loads from userBasicInfoRepo', async () => {
    const mockRepo = {
      getBasicInfo: async () => ({
        basicInfo: { name: 'Test', age: 30 },
        medicalHistory: 'diabetes',
        familyHistory: null,
        allergies: 'penicillin',
      }),
    };
    const mm = new MemoryManager({ userBasicInfoRepo: mockRepo });
    const profile = await mm.loadPatientProfile('u1');
    expect(profile.basicInfo.name).toBe('Test');
    expect(profile.medicalHistory).toBe('diabetes');
    expect(profile.allergies).toBe('penicillin');
  });

  test('loadPatientProfile handles repo error gracefully', async () => {
    const mockRepo = {
      getBasicInfo: async () => { throw new Error('db down'); },
    };
    const mm = new MemoryManager({ userBasicInfoRepo: mockRepo });
    expect(await mm.loadPatientProfile('u1')).toBeNull();
  });

  test('clearUserSessions removes in-memory data and allows re-hydration', async () => {
    let callCount = 0;
    const mockRepo = {
      getLatestSession: async () => {
        callCount++;
        return {
          sessionId: 's1',
          session: { messages: [{ role: 'user', content: 'hi' }] },
        };
      },
    };
    const mm = new MemoryManager({ chatSessionRepo: mockRepo });

    await mm.getRecentMessages('u1', 's1');
    expect(callCount).toBe(1);

    mm.clearUserSessions('u1');

    const msgs = await mm.getRecentMessages('u1', 's1');
    expect(callCount).toBe(2);
    expect(msgs).toHaveLength(1);
  });

  test('clearUserSessions does not affect other users', async () => {
    const mm = new MemoryManager();
    mm.appendToSession('u1', 's1', 'user', 'u1-msg');
    mm.appendToSession('u2', 's1', 'user', 'u2-msg');

    mm.clearUserSessions('u1');

    expect(await mm.getRecentMessages('u1', 's1')).toHaveLength(0);
    expect(await mm.getRecentMessages('u2', 's1')).toHaveLength(1);
  });
});
