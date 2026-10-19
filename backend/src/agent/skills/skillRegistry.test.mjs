import { describe, test, expect } from '@jest/globals';
import { SkillRegistry } from './skillRegistry.mjs';

const makeSkill = (name, opts = {}) => ({
  name,
  allowedTools: ['tool_a'],
  systemPrompt: () => 'prompt',
  postProcess: (t) => t,
  safetyRules: {},
  ...opts,
});

describe('SkillRegistry', () => {
  test('register and get by name', () => {
    const reg = new SkillRegistry();
    const skill = makeSkill('test_skill');
    reg.register(skill);
    expect(reg.get('test_skill')).toBe(skill);
  });

  test('register throws if name is missing', () => {
    const reg = new SkillRegistry();
    expect(() => reg.register({ allowedTools: [] })).toThrow('must have a name');
  });

  test('register throws if allowedTools is missing', () => {
    const reg = new SkillRegistry();
    expect(() => reg.register({ name: 'bad' })).toThrow('must have allowedTools');
  });

  test('has returns true/false', () => {
    const reg = new SkillRegistry();
    reg.register(makeSkill('a'));
    expect(reg.has('a')).toBe(true);
    expect(reg.has('b')).toBe(false);
  });

  test('list returns all names', () => {
    const reg = new SkillRegistry();
    reg.register(makeSkill('a'));
    reg.register(makeSkill('b'));
    expect(reg.list()).toEqual(['a', 'b']);
  });

  test('getDefault returns isDefault skill or first registered', () => {
    const reg = new SkillRegistry();
    reg.register(makeSkill('first'));
    reg.register(makeSkill('second', { isDefault: true }));
    reg.register(makeSkill('third'));
    expect(reg.getDefault().name).toBe('second');

    const reg2 = new SkillRegistry();
    reg2.register(makeSkill('only'));
    expect(reg2.getDefault().name).toBe('only');
  });
});
