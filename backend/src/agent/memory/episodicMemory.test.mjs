import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { EpisodicMemory } from './episodicMemory.mjs';

describe('EpisodicMemory', () => {
  let mockRepo;
  let em;

  beforeEach(() => {
    mockRepo = {
      getByUser: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(undefined),
      deleteByUser: jest.fn().mockResolvedValue(undefined),
    };
    em = new EpisodicMemory({ patientProfileRepo: mockRepo });
  });

  describe('getProfile', () => {
    test('returns repo data', async () => {
      mockRepo.getByUser.mockResolvedValue({ userId: 'u1', conditions: ['diabetes'] });
      const profile = await em.getProfile('u1');
      expect(profile.conditions).toEqual(['diabetes']);
    });

    test('returns null without repo', async () => {
      const noRepo = new EpisodicMemory();
      expect(await noRepo.getProfile('u1')).toBeNull();
    });

    test('returns null on repo error', async () => {
      mockRepo.getByUser.mockRejectedValue(new Error('db down'));
      expect(await em.getProfile('u1')).toBeNull();
    });
  });

  describe('extractFacts', () => {
    test('extracts conditions from messages', () => {
      const messages = [
        { role: 'user', content: '我有糖尿病和高血压' },
        { role: 'assistant', content: '了解，您的糖尿病需要持续管理。' },
      ];
      const facts = em.extractFacts(messages);
      expect(facts.conditions).toContain('糖尿病');
      expect(facts.conditions).toContain('高血压');
    });

    test('extracts allergies', () => {
      const messages = [
        { role: 'user', content: '我对青霉素过敏' },
      ];
      const facts = em.extractFacts(messages);
      expect(facts.allergies).toContain('青霉素');
    });

    test('extracts goals', () => {
      const messages = [
        { role: 'user', content: '我的目标是减重5公斤' },
      ];
      const facts = em.extractFacts(messages);
      expect(facts.goals).toContain('减重5公斤');
    });

    test('returns empty sets for messages with no medical content', () => {
      const messages = [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！有什么可以帮您的？' },
      ];
      const facts = em.extractFacts(messages);
      expect(facts.conditions).toEqual([]);
      expect(facts.allergies).toEqual([]);
      expect(facts.goals).toEqual([]);
    });

    test('ignores negations, family members, and assistant messages', () => {
      const messages = [
        { role: 'user', content: '我没有糖尿病，我妈妈有高血压。我对青霉素不过敏。' },
        { role: 'assistant', content: '糖尿病患者需要控制饮食。希望您早日康复。' },
      ];
      expect(em.extractFacts(messages)).toEqual({ conditions: [], allergies: [], goals: [] });
    });

    test('ignores questions about a condition or allergy', () => {
      const messages = [
        { role: 'user', content: '糖尿病能吃西瓜吗？对青霉素过敏的人可以用头孢吗？' },
      ];
      expect(em.extractFacts(messages)).toEqual({ conditions: [], allergies: [], goals: [] });
    });

    test('requires a first-person statement for conditions', () => {
      const facts = em.extractFacts([{ role: 'user', content: '高血压是常见病' }]);
      expect(facts.conditions).toEqual([]);
    });

    test('keeps facts from other clauses of the same message', () => {
      const facts = em.extractFacts([
        { role: 'user', content: '我爸爸有糖尿病，我自己确诊了高血压，对花粉过敏' },
      ]);
      expect(facts.conditions).toEqual(['高血压']);
      expect(facts.allergies).toEqual(['花粉']);
    });

    test('deduplicates extracted conditions', () => {
      const messages = [
        { role: 'user', content: '我有糖尿病' },
        { role: 'assistant', content: '您提到了糖尿病，请问确诊多久了？' },
      ];
      const facts = em.extractFacts(messages);
      expect(facts.conditions.filter(c => /糖尿病/.test(c))).toHaveLength(1);
    });
  });

  describe('updateFromConversation', () => {
    test('upserts extracted facts to repo', async () => {
      const messages = [
        { role: 'user', content: '我有高血压，对花粉过敏' },
      ];
      await em.updateFromConversation('u1', messages);
      expect(mockRepo.upsert).toHaveBeenCalledWith('u1', expect.objectContaining({
        conditions: expect.arrayContaining(['高血压']),
        allergies: expect.arrayContaining(['花粉']),
        lastUpdatedBy: 'agent',
      }));
    });

    test('does not call repo when no facts extracted', async () => {
      const messages = [
        { role: 'user', content: '谢谢' },
        { role: 'assistant', content: '不客气' },
      ];
      await em.updateFromConversation('u1', messages);
      expect(mockRepo.upsert).not.toHaveBeenCalled();
    });

    test('does nothing without repo', async () => {
      const noRepo = new EpisodicMemory();
      await noRepo.updateFromConversation('u1', [{ role: 'user', content: '我有糖尿病' }]);
    });

    test('handles empty messages', async () => {
      await em.updateFromConversation('u1', []);
      expect(mockRepo.upsert).not.toHaveBeenCalled();
    });
  });

  describe('deleteByUser', () => {
    test('delegates to repo', async () => {
      await em.deleteByUser('u1');
      expect(mockRepo.deleteByUser).toHaveBeenCalledWith('u1');
    });
  });
});
