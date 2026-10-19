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
  const recentMessages = memoryManager.getRecentMessages(userId, sessionId);

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
