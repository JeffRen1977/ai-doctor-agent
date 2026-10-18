import { generateText, isStepCount } from 'ai';
import { getAgentModel } from './config/agentProvider.mjs';
import { healthChatSkill } from './skills/healthChat.mjs';

export async function chat({
  userId,
  userEmail,
  message,
  sessionId,
  language,
  toolRegistry,
  memoryManager,
}) {
  const skill = healthChatSkill;

  const patientProfile = await memoryManager.loadPatientProfile(userId);
  const relevantMemories = await memoryManager.searchRelevant(message, userId);
  const recentMessages = memoryManager.getRecentMessages(sessionId);

  const tools = toolRegistry.getForSkill(skill);

  const toolsContext = {};
  for (const name of Object.keys(tools)) {
    if (name === 'query_risk_alerts') {
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

  const answer = result.text;

  memoryManager.appendToSession(sessionId, 'user', message);
  memoryManager.appendToSession(sessionId, 'assistant', answer);

  return {
    message: answer,
    steps: result.steps.length,
    usage: result.usage,
  };
}
