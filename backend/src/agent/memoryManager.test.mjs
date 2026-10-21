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
    expect(profile.learnedFromChat).toEqual({ conditions: ['hypertension'], goals: ['减重'] });
  });

  test('loadPatientProfile keeps user-entered allergies when the learned profile has none', async () => {
    const mm = new MemoryManager({
      userBasicInfoRepo: { getBasicInfo: async () => ({ allergies: '青霉素过敏' }) },
      patientProfileRepo: {
        getByUser: async () => ({
          userId: 'u1', conditions: [], allergies: [], goals: ['减肥'], contraindications: [],
          concerns: [], preferences: {}, lastUpdatedBy: 'agent', metadata: {}, createdAt: 'x', updatedAt: 'y',
        }),
      },
    });
    const profile = await mm.loadPatientProfile('u1');
    expect(profile.allergies).toBe('青霉素过敏');
    expect(profile.learnedFromChat).toEqual({ goals: ['减肥'] });
    expect(profile).not.toHaveProperty('userId');
    expect(profile).not.toHaveProperty('metadata');
  });

  test('loadPatientProfile omits learnedFromChat when the learned profile is empty', async () => {
    const mm = new MemoryManager({
      userBasicInfoRepo: { getBasicInfo: async () => ({ medicalHistory: '无' }) },
      patientProfileRepo: { getByUser: async () => ({ userId: 'u1', conditions: [], allergies: [], preferences: {} }) },
    });
    const profile = await mm.loadPatientProfile('u1');
    expect(profile).not.toHaveProperty('learnedFromChat');
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

  test('rememberTurn stores conclusions and profile facts from one turn', async () => {
    const mockMemRepo = { save: jest.fn().mockResolvedValue(undefined) };
    const mockProfileRepo = { upsert: jest.fn().mockResolvedValue(undefined) };
    const mm = new MemoryManager({
      agentMemoryRepo: mockMemRepo,
      patientProfileRepo: mockProfileRepo,
    });

    await mm.rememberTurn('u1', 's1', '我有糖尿病', '根据您的情况，建议定期监测血糖。');

    expect(mockMemRepo.save).toHaveBeenCalledWith('u1', expect.objectContaining({
      type: 'conclusion', sourceSessionId: 's1',
    }));
    expect(mockProfileRepo.upsert).toHaveBeenCalledWith('u1', expect.objectContaining({
      conditions: ['糖尿病'],
    }));
  });

  test('rememberTurn does not touch the short-term session', async () => {
    const mm = new MemoryManager({ agentMemoryRepo: { save: jest.fn() } });
    mm.appendToSession('u1', 's1', 'user', 'hi');
    await mm.rememberTurn('u1', 's1', 'hi', 'hello');
    expect(await mm.getRecentMessages('u1', 's1')).toHaveLength(1);
  });

  test('rememberTurn swallows repo errors', async () => {
    const mm = new MemoryManager({
      patientProfileRepo: { upsert: jest.fn().mockRejectedValue(new Error('db down')) },
      agentMemoryRepo: { save: jest.fn().mockRejectedValue(new Error('db down')) },
    });
    await expect(mm.rememberTurn('u1', 's1', '我有糖尿病', '可能是血糖偏高')).resolves.toBeUndefined();
  });

  describe('summarizeSession', () => {
    test('compresses a multi-turn session into a summary memory', async () => {
      const mockMemRepo = { save: jest.fn().mockResolvedValue(undefined), search: jest.fn() };
      const mockGenerate = jest.fn().mockResolvedValue({ text: '患者讨论了血糖控制问题，AI建议定期监测。' });
      const mm = new MemoryManager({ agentMemoryRepo: mockMemRepo });

      mm.appendToSession('u1', 's1', 'user', '我的血糖最近偏高');
      mm.appendToSession('u1', 's1', 'assistant', '建议您定期监测血糖');
      mm.appendToSession('u1', 's1', 'user', '多久测一次');
      mm.appendToSession('u1', 's1', 'assistant', '建议每天测两次');

      const summary = await mm.summarizeSession('u1', 's1', { generateTextFn: mockGenerate });
      expect(summary).toBe('患者讨论了血糖控制问题，AI建议定期监测。');
      expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.stringContaining('血糖'),
      }));
      expect(mockMemRepo.save).toHaveBeenCalledWith('u1', expect.objectContaining({
        type: 'summary', importance: 0.6, sourceSessionId: 's1',
      }));
    });

    test('returns null for sessions with fewer than 4 messages', async () => {
      const mm = new MemoryManager();
      mm.appendToSession('u1', 's1', 'user', 'hi');
      mm.appendToSession('u1', 's1', 'assistant', 'hello');
      expect(await mm.summarizeSession('u1', 's1')).toBeNull();
    });

    test('returns null when generateText returns empty text', async () => {
      const mm = new MemoryManager({ agentMemoryRepo: { save: jest.fn(), search: jest.fn() } });
      mm.appendToSession('u1', 's1', 'user', 'a');
      mm.appendToSession('u1', 's1', 'assistant', 'b');
      mm.appendToSession('u1', 's1', 'user', 'c');
      mm.appendToSession('u1', 's1', 'assistant', 'd');

      const result = await mm.summarizeSession('u1', 's1', {
        generateTextFn: jest.fn().mockResolvedValue({ text: '' }),
      });
      expect(result).toBeNull();
    });

    test('swallows generateText errors and returns null', async () => {
      const mm = new MemoryManager({ agentMemoryRepo: { save: jest.fn(), search: jest.fn() } });
      mm.appendToSession('u1', 's1', 'user', 'a');
      mm.appendToSession('u1', 's1', 'assistant', 'b');
      mm.appendToSession('u1', 's1', 'user', 'c');
      mm.appendToSession('u1', 's1', 'assistant', 'd');

      const result = await mm.summarizeSession('u1', 's1', {
        generateTextFn: jest.fn().mockRejectedValue(new Error('LLM down')),
      });
      expect(result).toBeNull();
    });

    test('truncates long transcripts before sending to LLM', async () => {
      const mockGenerate = jest.fn().mockResolvedValue({ text: 'summary' });
      const mm = new MemoryManager({ agentMemoryRepo: { save: jest.fn(), search: jest.fn() } });

      for (let i = 0; i < 50; i++) {
        mm.appendToSession('u1', 's1', 'user', '很长的消息'.repeat(100));
        mm.appendToSession('u1', 's1', 'assistant', '很长的回复'.repeat(100));
      }

      await mm.summarizeSession('u1', 's1', { generateTextFn: mockGenerate });
      const prompt = mockGenerate.mock.calls[0][0].prompt;
      expect(prompt.length).toBeLessThanOrEqual(6020);
    });
  });
});
