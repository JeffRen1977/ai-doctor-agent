import { createOpenAI } from '@ai-sdk/openai';

export function getAgentProvider() {
  if (process.env.AGENT_LLM_PROVIDER === 'dashscope') {
    return createOpenAI({
      baseURL: process.env.DASHSCOPE_BASE_URL
        || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: process.env.DASHSCOPE_API_KEY,
    });
  }
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function getAgentModel() {
  return getAgentProvider()(process.env.AGENT_MODEL || 'gpt-4o');
}

export function getLightModel() {
  return getAgentProvider()(process.env.AGENT_MODEL_LIGHT || 'gpt-4o-mini');
}

export function getEmbeddingModel() {
  return getAgentProvider().embedding(
    process.env.AGENT_EMBEDDING_MODEL || 'text-embedding-3-small',
  );
}
