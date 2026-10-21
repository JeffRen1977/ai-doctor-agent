import { generateText, isStepCount } from 'ai';
import { getAgentModel } from './config/agentProvider.mjs';
import { healthChatSkill } from './skills/healthChat.mjs';
import { classifyIntent } from './skills/intentRouter.mjs';

const EMAIL_CONTEXT_TOOLS = new Set(['query_risk_alerts', 'query_wearable_stream']);
const DEFAULT_MAX_TOKENS = 4096;
const TOKEN_BUDGET_FALLBACK_ZH = '抱歉，本次回复超出了处理预算，请尝试简化您的问题或稍后再试。';
const TOKEN_BUDGET_FALLBACK_EN = 'Sorry, this response exceeded the processing budget. Please try simplifying your question or try again later.';

export async function chat({
  userId,
  userEmail,
  message,
  sessionId,
  language,
  toolRegistry,
  memoryManager,
  skillRegistry,
  safety,
  traceRecorder,
}) {
  const startTime = Date.now();
  const skill = skillRegistry
    ? skillRegistry.get(classifyIntent(message, skillRegistry))
    : healthChatSkill;

  if (safety?.interceptSensitiveTopics) {
    const crisisResponse = safety.interceptSensitiveTopics(message, language);
    if (crisisResponse) {
      return {
        message: crisisResponse,
        skillName: skill.name,
        steps: 0,
        usage: {},
        intercepted: 'crisis',
      };
    }
  }

  const patientProfile = await memoryManager.loadPatientProfile(userId);
  const relevantMemories = await memoryManager.searchRelevant(message, userId);
  let recentMessages = await memoryManager.getRecentMessages(userId, sessionId);

  let userAlreadyInMemory = false;
  if (recentMessages.length > 0) {
    const last = recentMessages[recentMessages.length - 1];
    if (last.role === 'user' && last.content === message) {
      recentMessages = recentMessages.slice(0, -1);
      userAlreadyInMemory = true;
    }
  }

  const tools = toolRegistry.getForSkill(skill);

  if (safety?.assertWritePermission) {
    for (const name of Object.keys(tools)) {
      safety.assertWritePermission(name, toolRegistry, skill);
    }
  }

  const toolsContext = {};
  for (const name of Object.keys(tools)) {
    if (EMAIL_CONTEXT_TOOLS.has(name)) {
      toolsContext[name] = { userEmail };
    } else {
      toolsContext[name] = { userId };
    }
  }

  let result;
  let budgetExceeded = false;
  try {
    result = await generateText({
      model: getAgentModel(),
      system: skill.systemPrompt({ patientProfile, relevantMemories, language }),
      messages: [
        ...recentMessages,
        { role: 'user', content: message },
      ],
      tools,
      toolsContext,
      maxTokens: DEFAULT_MAX_TOKENS,
      stopWhen: isStepCount(5),
    });
  } catch (err) {
    if (err?.message?.includes('max_tokens') || err?.code === 'max_tokens') {
      budgetExceeded = true;
    } else {
      throw err;
    }
  }

  const latencyMs = Date.now() - startTime;

  if (budgetExceeded) {
    const fallback = language === 'en' ? TOKEN_BUDGET_FALLBACK_EN : TOKEN_BUDGET_FALLBACK_ZH;
    return {
      message: fallback,
      skillName: skill.name,
      steps: 0,
      usage: {},
      budgetExceeded: true,
    };
  }

  let answer = skill.postProcess ? skill.postProcess(result.text) : result.text;

  if (safety?.detectHallucination) {
    const hallucinationCheck = safety.detectHallucination(answer, result.steps);
    if (hallucinationCheck.flagged) {
      answer += language === 'en'
        ? '\n\n⚠️ Note: Some specific values in this response may not have been verified against your records. Please confirm with your healthcare provider.'
        : '\n\n⚠️ 提示：本回答中的部分具体数值未经您的健康记录核实，请以医疗机构的检查结果为准。';
    }
  }

  if (!userAlreadyInMemory) {
    memoryManager.appendToSession(userId, sessionId, 'user', message);
  }
  memoryManager.appendToSession(userId, sessionId, 'assistant', answer);

  if (traceRecorder) {
    traceRecorder.record({
      userId, sessionId, skill: skill.name, userMessage: message,
      result, latencyMs,
    }).catch(() => {});
  }

  return {
    message: answer,
    skillName: skill.name,
    steps: result.steps.length,
    usage: result.usage,
  };
}
