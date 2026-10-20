import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { LongTermMemory } from './longTermMemory.mjs';

describe('LongTermMemory', () => {
  let mockRepo;
  let ltm;

  beforeEach(() => {
    mockRepo = {
      search: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    };
    ltm = new LongTermMemory({ agentMemoryRepo: mockRepo });
  });

  describe('search', () => {
    test('delegates to repo and returns results', async () => {
      mockRepo.search.mockResolvedValue([
        { content: '血糖改善', type: 'conclusion', score: 0.8 },
      ]);
      const results = await ltm.search('血糖', 'u1', 5);
      expect(mockRepo.search).toHaveBeenCalledWith('u1', '血糖', 5);
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('血糖改善');
    });

    test('returns empty when repo is null', async () => {
      const noRepo = new LongTermMemory();
      expect(await noRepo.search('test', 'u1')).toEqual([]);
    });

    test('returns empty on repo error', async () => {
      mockRepo.search.mockRejectedValue(new Error('db down'));
      expect(await ltm.search('test', 'u1')).toEqual([]);
    });
  });

  describe('store', () => {
    test('passes correct shape to repo', async () => {
      await ltm.store('u1', { type: 'conclusion', content: 'test', importance: 0.8, sourceSessionId: 's1' });
      expect(mockRepo.save).toHaveBeenCalledWith('u1', {
        type: 'conclusion', content: 'test', importance: 0.8, sourceSessionId: 's1',
      });
    });
  });

  describe('extractAndStore', () => {
    test('extracts conclusions from assistant messages with medical keywords', async () => {
      const messages = [
        { role: 'user', content: '我头疼' },
        { role: 'assistant', content: '根据您的症状，建议您多休息并监测体温。' },
      ];
      await ltm.extractAndStore('u1', 's1', messages);
      expect(mockRepo.save).toHaveBeenCalledWith('u1', expect.objectContaining({
        type: 'conclusion', importance: 0.7, sourceSessionId: 's1',
      }));
    });

    test('extracts preferences from user messages', async () => {
      const messages = [
        { role: 'user', content: '我不想吃西药' },
        { role: 'assistant', content: '好的，了解您的偏好。' },
      ];
      await ltm.extractAndStore('u1', 's1', messages);
      const calls = mockRepo.save.mock.calls;
      const prefCall = calls.find(c => c[1].type === 'preference');
      expect(prefCall).toBeDefined();
      expect(prefCall[1].content).toBe('我不想吃西药');
    });

    test('does not store general replies that only mention 需要 or 注意', async () => {
      const messages = [
        { role: 'user', content: '谢谢' },
        { role: 'assistant', content: '不客气！保持好心情很重要，需要注意劳逸结合，有问题随时来问我。' },
      ];
      await ltm.extractAndStore('u1', 's1', messages);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    test('stores each conclusion once', async () => {
      const msg = '根据您的情况，建议您去医院做一个详细的血液检查，排除其他可能的原因。';
      const messages = [
        { role: 'user', content: '怎么办' },
        { role: 'assistant', content: msg },
      ];
      await ltm.extractAndStore('u1', 's1', messages);
      const contents = mockRepo.save.mock.calls.map(c => c[1].content);
      expect(contents).toEqual([msg]);
    });

    test('truncates long content before storing', async () => {
      const messages = [
        { role: 'user', content: `我不想${'吃药'.repeat(200)}` },
        { role: 'assistant', content: `可能是${'睡眠不足'.repeat(200)}` },
      ];
      await ltm.extractAndStore('u1', 's1', messages);
      const byType = Object.fromEntries(mockRepo.save.mock.calls.map(c => [c[1].type, c[1].content]));
      expect(byType.preference).toHaveLength(200);
      expect(byType.conclusion).toHaveLength(500);
    });

    test('stores nothing for empty conversation', async () => {
      await ltm.extractAndStore('u1', 's1', []);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    test('stores nothing when no patterns match', async () => {
      const messages = [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！' },
      ];
      await ltm.extractAndStore('u1', 's1', messages);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });
});
