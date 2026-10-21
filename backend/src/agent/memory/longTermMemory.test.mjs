import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { LongTermMemory } from './longTermMemory.mjs';

const FAKE_EMBEDDING = [0.1, 0.2, 0.3];

function makeLtm(repoOverrides = {}) {
  const mockRepo = {
    search: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
    ...repoOverrides,
  };
  const mockEmbed = jest.fn().mockResolvedValue({ embedding: FAKE_EMBEDDING });
  const ltm = new LongTermMemory({ agentMemoryRepo: mockRepo, embedFn: mockEmbed });
  return { ltm, mockRepo, mockEmbed };
}

describe('LongTermMemory', () => {
  describe('generateEmbedding', () => {
    test('calls embedFn and returns the embedding', async () => {
      const { ltm, mockEmbed } = makeLtm();
      const emb = await ltm.generateEmbedding('hello');
      expect(mockEmbed).toHaveBeenCalledWith(expect.objectContaining({ value: 'hello' }));
      expect(emb).toEqual(FAKE_EMBEDDING);
    });

    test('returns null on empty input', async () => {
      const { ltm } = makeLtm();
      expect(await ltm.generateEmbedding('')).toBeNull();
      expect(await ltm.generateEmbedding(null)).toBeNull();
    });

    test('returns null and warns on embed failure', async () => {
      const failEmbed = jest.fn().mockRejectedValue(new Error('API down'));
      const ltm = new LongTermMemory({
        agentMemoryRepo: { search: jest.fn(), save: jest.fn() },
        embedFn: failEmbed,
      });
      expect(await ltm.generateEmbedding('test')).toBeNull();
    });

    test('truncates long text before embedding', async () => {
      const { ltm, mockEmbed } = makeLtm();
      const longText = 'a'.repeat(10000);
      await ltm.generateEmbedding(longText);
      const passedValue = mockEmbed.mock.calls[0][0].value;
      expect(passedValue.length).toBe(8000);
    });
  });

  describe('search', () => {
    test('delegates to repo with query embedding', async () => {
      const { ltm, mockRepo } = makeLtm({
        search: jest.fn().mockResolvedValue([
          { content: '血糖改善', type: 'conclusion', score: 0.8 },
        ]),
      });
      const results = await ltm.search('血糖', 'u1', 5);
      expect(mockRepo.search).toHaveBeenCalledWith('u1', '血糖', 5, FAKE_EMBEDDING);
      expect(results).toHaveLength(1);
    });

    test('returns empty when repo is null', async () => {
      const noRepo = new LongTermMemory();
      expect(await noRepo.search('test', 'u1')).toEqual([]);
    });

    test('returns empty on repo error', async () => {
      const { ltm } = makeLtm({
        search: jest.fn().mockRejectedValue(new Error('db down')),
      });
      expect(await ltm.search('test', 'u1')).toEqual([]);
    });

    test('passes null embedding when embed fails', async () => {
      const failEmbed = jest.fn().mockRejectedValue(new Error('no key'));
      const mockRepo = {
        search: jest.fn().mockResolvedValue([{ content: 'keyword hit', score: 0.5 }]),
        save: jest.fn(),
      };
      const ltm = new LongTermMemory({ agentMemoryRepo: mockRepo, embedFn: failEmbed });
      const results = await ltm.search('keyword', 'u1');
      expect(mockRepo.search).toHaveBeenCalledWith('u1', 'keyword', 5, null);
      expect(results).toHaveLength(1);
    });
  });

  describe('store', () => {
    test('generates embedding and passes it to repo', async () => {
      const { ltm, mockRepo, mockEmbed } = makeLtm();
      await ltm.store('u1', { type: 'conclusion', content: 'test', importance: 0.8, sourceSessionId: 's1' });
      expect(mockEmbed).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledWith('u1', {
        type: 'conclusion', content: 'test', importance: 0.8, sourceSessionId: 's1',
        embedding: FAKE_EMBEDDING,
      });
    });

    test('stores with null embedding when embed fails', async () => {
      const failEmbed = jest.fn().mockRejectedValue(new Error('API down'));
      const mockRepo = { search: jest.fn(), save: jest.fn() };
      const ltm = new LongTermMemory({ agentMemoryRepo: mockRepo, embedFn: failEmbed });
      await ltm.store('u1', { type: 'conclusion', content: 'test' });
      expect(mockRepo.save).toHaveBeenCalledWith('u1', expect.objectContaining({
        embedding: null,
      }));
    });
  });

  describe('extractAndStore', () => {
    test('extracts conclusions from assistant messages with medical keywords', async () => {
      const { ltm, mockRepo } = makeLtm();
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
      const { ltm, mockRepo } = makeLtm();
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
      const { ltm, mockRepo } = makeLtm();
      const messages = [
        { role: 'user', content: '谢谢' },
        { role: 'assistant', content: '不客气！保持好心情很重要，需要注意劳逸结合，有问题随时来问我。' },
      ];
      await ltm.extractAndStore('u1', 's1', messages);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    test('stores each conclusion once', async () => {
      const { ltm, mockRepo } = makeLtm();
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
      const { ltm, mockRepo } = makeLtm();
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
      const { ltm, mockRepo } = makeLtm();
      await ltm.extractAndStore('u1', 's1', []);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    test('stores nothing when no patterns match', async () => {
      const { ltm, mockRepo } = makeLtm();
      const messages = [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！' },
      ];
      await ltm.extractAndStore('u1', 's1', messages);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    test('each stored memory includes embedding', async () => {
      const { ltm, mockRepo } = makeLtm();
      const messages = [
        { role: 'user', content: '我不想吃甜食' },
        { role: 'assistant', content: '建议您减少精制糖的摄入。' },
      ];
      await ltm.extractAndStore('u1', 's1', messages);
      for (const call of mockRepo.save.mock.calls) {
        expect(call[1].embedding).toEqual(FAKE_EMBEDDING);
      }
    });
  });
});
