import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import { getAgentProvider, getAgentModel, getLightModel } from './agentProvider.mjs';

const origEnv = { ...process.env };

beforeEach(() => {
  delete process.env.AGENT_LLM_PROVIDER;
  delete process.env.DASHSCOPE_API_KEY;
  delete process.env.DASHSCOPE_BASE_URL;
  delete process.env.AGENT_MODEL;
  delete process.env.AGENT_MODEL_LIGHT;
});

afterAll(() => {
  Object.assign(process.env, origEnv);
});

describe('agentProvider', () => {
  test('defaults to OpenAI provider when AGENT_LLM_PROVIDER is not set', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const provider = getAgentProvider();
    expect(typeof provider).toBe('function');
  });

  test('uses DashScope when AGENT_LLM_PROVIDER=dashscope', () => {
    process.env.AGENT_LLM_PROVIDER = 'dashscope';
    process.env.DASHSCOPE_API_KEY = 'test-ds-key';
    const provider = getAgentProvider();
    expect(typeof provider).toBe('function');
  });

  test('getAgentModel defaults to gpt-4o', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const model = getAgentModel();
    expect(model.modelId).toBe('gpt-4o');
  });

  test('getAgentModel reads AGENT_MODEL env var', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.AGENT_MODEL = 'gpt-4o-mini';
    const model = getAgentModel();
    expect(model.modelId).toBe('gpt-4o-mini');
  });

  test('getLightModel defaults to gpt-4o-mini', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const model = getLightModel();
    expect(model.modelId).toBe('gpt-4o-mini');
  });
});
