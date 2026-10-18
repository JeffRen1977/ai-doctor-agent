import { describe, test, expect } from '@jest/globals';
import { ToolRegistry } from './registry.mjs';

describe('ToolRegistry', () => {
  test('registers and retrieves tools', () => {
    const reg = new ToolRegistry();
    const fakeTool = { execute: async () => {} };
    reg.register('query_vitals', fakeTool, 'read');

    expect(reg.get('query_vitals')).toBe(fakeTool);
    expect(reg.getPermission('query_vitals')).toBe('read');
  });

  test('returns undefined for unregistered tool', () => {
    const reg = new ToolRegistry();
    expect(reg.get('nonexistent')).toBeUndefined();
  });

  test('getForSkill returns only allowed tools', () => {
    const reg = new ToolRegistry();
    reg.register('query_vitals', { id: 1 });
    reg.register('query_meds', { id: 2 });
    reg.register('write_alert', { id: 3 }, 'write');

    const skill = { allowedTools: ['query_vitals', 'query_meds'] };
    const result = reg.getForSkill(skill);

    expect(Object.keys(result)).toEqual(['query_vitals', 'query_meds']);
    expect(result.write_alert).toBeUndefined();
  });

  test('getForSkill silently skips unregistered tool names', () => {
    const reg = new ToolRegistry();
    reg.register('query_vitals', { id: 1 });

    const skill = { allowedTools: ['query_vitals', 'nonexistent'] };
    const result = reg.getForSkill(skill);

    expect(Object.keys(result)).toEqual(['query_vitals']);
  });

  test('identifies write vs read tools', () => {
    const reg = new ToolRegistry();
    reg.register('query_vitals', {}, 'read');
    reg.register('write_alert', {}, 'write');

    expect(reg.isWriteTool('query_vitals')).toBe(false);
    expect(reg.isWriteTool('write_alert')).toBe(true);
  });

  test('defaults to read permission', () => {
    const reg = new ToolRegistry();
    reg.register('some_tool', {});
    expect(reg.getPermission('some_tool')).toBe('read');
    expect(reg.isWriteTool('some_tool')).toBe(false);
  });

  test('list returns all registered tool names', () => {
    const reg = new ToolRegistry();
    reg.register('a', {});
    reg.register('b', {});
    reg.register('c', {});
    expect(reg.list()).toEqual(['a', 'b', 'c']);
  });
});
