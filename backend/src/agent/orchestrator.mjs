import { generateText, isStepCount } from 'ai';
import { getAgentModel } from './config/agentProvider.mjs';
import { healthChatSkill } from './skills/healthChat.mjs';
import { classifyIntent } from './skills/intentRouter.mjs';

const EMAIL_CONTEXT_TOOLS = new Set(['query_risk_alerts', 'query_wearable_stream']);

export async function chat({
  userId,
  userEmail,
  message,
  sessionId,
  language,
  toolRegistry,
  memoryManager,
  skillRegistry,
}) {
  const skill = skillRegistry
    ? skillRegistry.get(classifyIntent(message, skillRegistry))
    : healthChatSkill;

  const patientProfile = await memoryManager.loadPatientProfile(userId);
  const relevantMemories = await memoryManager.searchRelevant(message, userId);
  let recentMessages = await memoryManager.getRecentMessages(userId, sessionId);

  // The route saves the user message to the DB before calling the agent.
  // When memory is cold, hydration loads it back, causing a duplicate.
  if (recentMessages.length > 0) {
    const last = recentMessages[recentMessages.length - 1];
    if (last.role === 'user' && last.content === message) {
      recentMessages = recentMessages.slice(0, -1);
    }
  }

  const tools = toolRegistry.getForSkill(skill);

  const toolsContext = {};
  for (const name of Object.keys(tools)) {
    if (EMAIL_CONTEXT_TOOLS.has(name)) {
      toolsContext[name] = { userEmail };
    } else {
      toolsContext[name] = { userId };
    }
  }

  const result = await generateText({
    model: getAgentModel(),
    system: skill.systemPrompt({ patientProfile, relevantMemories, language }),
    messages: [
      ...recentMessages,
      { role: 'user', content: message },
    ],
    tools,
    toolsContext,
    stopWhen: isStepCount(5),
  });

  const answer = skill.postProcess ? skill.postProcess(result.text) : result.text;

  memoryManager.appendToSession(userId, sessionId, 'user', message);
  memoryManager.appendToSession(userId, sessionId, 'assistant', answer);

  return {
    message: answer,
    skillName: skill.name,
    steps: result.steps.length,
    usage: result.usage,
  };
}
