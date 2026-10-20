import { describe, test, expect, jest, beforeEach } from '@jest/globals';
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

  test('loadPatientProfile returns null without repos', async () => {
    const mm = new MemoryManager();
    expect(await mm.loadPatientProfile('u1')).toBeNull();
  });

  test('searchRelevant returns empty without repo', async () => {
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

  test('loadPatientProfile merges basic info and episodic profile', async () => {
    const mockBasicRepo = {
      getBasicInfo: async () => ({
        basicInfo: { name: 'Test', age: 30 },
        medicalHistory: 'diabetes',
        familyHistory: null,
        allergies: 'penicillin',
      }),
    };
    const mockProfileRepo = {
      getByUser: async () => ({
        userId: 'u1',
        conditions: ['hypertension'],
        goals: ['减重'],
      }),
    };
    const mm = new MemoryManager({
      userBasicInfoRepo: mockBasicRepo,
      patientProfileRepo: mockProfileRepo,
    });
    const profile = await mm.loadPatientProfile('u1');
    expect(profile.basicInfo.name).toBe('Test');
    expect(profile.medicalHistory).toBe('diabetes');
    expect(profile.conditions).toEqual(['hypertension']);
    expect(profile.goals).toEqual(['减重']);
  });

  test('loadPatientProfile returns basic info only when no episodic data', async () => {
    const mockBasicRepo = {
      getBasicInfo: async () => ({
        basicInfo: { name: 'Test' },
        medicalHistory: null,
        familyHistory: null,
        allergies: null,
      }),
    };
    const mockProfileRepo = { getByUser: async () => null };
    const mm = new MemoryManager({
      userBasicInfoRepo: mockBasicRepo,
      patientProfileRepo: mockProfileRepo,
    });
    const profile = await mm.loadPatientProfile('u1');
    expect(profile.basicInfo.name).toBe('Test');
  });

  test('loadPatientProfile handles repo error gracefully', async () => {
    const mockRepo = {
      getBasicInfo: async () => { throw new Error('db down'); },
    };
    const mm = new MemoryManager({ userBasicInfoRepo: mockRepo });
    expect(await mm.loadPatientProfile('u1')).toBeNull();
  });

  test('searchRelevant delegates to longTerm memory', async () => {
    const mockMemRepo = {
      search: jest.fn().mockResolvedValue([
        { content: '之前建议减少碳水', type: 'conclusion', score: 0.9 },
      ]),
    };
    const mm = new MemoryManager({ agentMemoryRepo: mockMemRepo });
    const results = await mm.searchRelevant('碳水', 'u1');
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('之前建议减少碳水');
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

  test('summarizeAndClear extracts memories then clears', async () => {
    const mockMemRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue([]),
    };
    const mockProfileRepo = {
      getByUser: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(undefined),
    };
    const mm = new MemoryManager({
      agentMemoryRepo: mockMemRepo,
      patientProfileRepo: mockProfileRepo,
    });

    mm.appendToSession('u1', 's1', 'user', '我有糖尿病');
    mm.appendToSession('u1', 's1', 'assistant', '根据您的情况，建议定期监测血糖。这是一段很长的回复，确保超过50个字符才能被提取为摘要。');

    await mm.summarizeAndClear('u1', 's1');

    expect(mockMemRepo.save).toHaveBeenCalled();
    expect(mockProfileRepo.upsert).toHaveBeenCalledWith('u1', expect.objectContaining({
      conditions: expect.arrayContaining(['糖尿病']),
    }));
    expect(await mm.getRecentMessages('u1', 's1')).toHaveLength(0);
  });

  test('summarizeAndClear works with empty session', async () => {
    const mockMemRepo = {
      save: jest.fn(),
      search: jest.fn().mockResolvedValue([]),
    };
    const mm = new MemoryManager({ agentMemoryRepo: mockMemRepo });

    await mm.summarizeAndClear('u1', 's1');
    expect(mockMemRepo.save).not.toHaveBeenCalled();
  });
});
