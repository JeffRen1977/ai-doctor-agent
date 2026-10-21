import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const _consentService = require('../services/consentService');
const _disclaimerService = require('../services/medicalDisclaimerService');
const _contentModerationService = require('../services/contentModerationService');
const _auditService = require('../services/auditService');
const _logger = require('../observability/logger');

function getAgentProvider() {
  return process.env.AGENT_LLM_PROVIDER === 'dashscope' ? 'dashscope' : 'openai';
}

export function createAgentSafety(deps = {}) {
  const consentService = deps.consentService ?? _consentService;
  const disclaimerService = deps.disclaimerService ?? _disclaimerService;
  const contentModerationService = deps.contentModerationService ?? _contentModerationService;
  const auditService = deps.auditService ?? _auditService;
  const logger = deps.logger ?? _logger;

  const CRISIS_PATTERNS_ZH = /自杀|自残|不想活|想死|活不下去|结束生命|跳楼|割腕|吞药自[杀尽]/;
  const CRISIS_PATTERNS_EN = /\b(suicid|self[- ]?harm|kill myself|end my life|want to die|don'?t want to live)\b/i;
  const CRISIS_RESPONSE_ZH = [
    '我非常关心您的安全。您现在的感受很重要，请不要独自面对。',
    '',
    '请立即拨打以下求助热线：',
    '- 全国24小时心理援助热线：400-161-9995',
    '- 北京心理危机研究与干预中心：010-82951332',
    '- 生命热线：400-821-1215',
    '',
    '如果您身边有信任的家人或朋友，请立即联系他们。',
    '如果您处于紧急危险中，请拨打 120 或前往最近的医院急诊。',
  ].join('\n');
  const CRISIS_RESPONSE_EN = [
    'I care deeply about your safety. What you\'re feeling matters, and you don\'t have to face this alone.',
    '',
    'Please reach out for help right now:',
    '- National Crisis Hotline (China): 400-161-9995',
    '- If outside China: contact your local emergency services or crisis hotline',
    '',
    'Please contact a trusted family member or friend immediately.',
    'If you are in immediate danger, call emergency services.',
  ].join('\n');

  const NUMERIC_RE = /\d+\.?\d*\s*(?:mg|ml|mmol|μg|mcg|ug|g\/|mmHg|bpm|次\/分|毫克|毫升|单位)/i;

  return {
    async assertAgentConsent(userEmail) {
      await consentService.assertCanCallAi(userEmail, getAgentProvider());
    },

    interceptSensitiveTopics(message, language = 'zh') {
      if (!message) return null;
      const isCrisis = CRISIS_PATTERNS_ZH.test(message) || CRISIS_PATTERNS_EN.test(message);
      if (!isCrisis) return null;
      logger.warn({ message: message.slice(0, 100) }, 'Crisis content detected — returning safe response');
      return language === 'en' ? CRISIS_RESPONSE_EN : CRISIS_RESPONSE_ZH;
    },

    detectHallucination(answer, steps) {
      if (!answer || !steps) return { flagged: false };
      const hasNumericClaim = NUMERIC_RE.test(answer);
      if (!hasNumericClaim) return { flagged: false };
      const hasToolCall = steps.some(
        (s) => s.toolCalls && s.toolCalls.length > 0,
      );
      if (hasToolCall) return { flagged: false };
      logger.warn('Possible hallucination: numeric medical claim without tool call');
      return {
        flagged: true,
        reason: 'numeric_without_tool_call',
      };
    },

    assertWritePermission(toolName, toolRegistry, skill) {
      if (!toolRegistry || !toolRegistry.isWriteTool(toolName)) return;
      if (!skill.safetyRules?.allowWrite) {
        throw new Error(`Skill "${skill.name}" is not authorized for write tool "${toolName}"`);
      }
    },

    async moderateAgentOutput(text, language = 'zh') {
      if (!contentModerationService.isConfigured() || !text) return text;
      try {
        const result = await contentModerationService.moderateHealthContent(text);
        if (!result.safe) {
          logger.warn({ labels: result.labels }, 'Agent output blocked by content moderation');
          return null;
        }
      } catch (err) {
        logger.error({ err: { message: err?.message } }, 'Agent content moderation check failed');
      }
      return text;
    },

    appendDisclaimer(text, language = 'zh') {
      return disclaimerService.wrapResponse(text, 'message', language);
    },

    async recordAgentAudit({ userEmail, message, answer, latencyMs, success, errorMessage, steps, skillName }) {
      try {
        await auditService.recordAiDecision({
          operation: skillName || 'healthChat',
          provider: getAgentProvider(),
          model: process.env.AGENT_MODEL || 'gpt-4o',
          input: message,
          output: success ? { success: true, message: answer } : null,
          latencyMs,
          success,
          errorMessage: errorMessage ?? null,
          subjectEmail: userEmail,
          metadata: { inputKind: 'message', agentPath: true, steps },
        });
      } catch (err) {
        logger.error({ err: { message: err?.message } }, 'Agent audit recording failed');
      }
    },
  };
}

const defaultSafety = createAgentSafety();

export const assertAgentConsent = defaultSafety.assertAgentConsent;
export const interceptSensitiveTopics = defaultSafety.interceptSensitiveTopics;
export const detectHallucination = defaultSafety.detectHallucination;
export const assertWritePermission = defaultSafety.assertWritePermission;
export const moderateAgentOutput = defaultSafety.moderateAgentOutput;
export const appendDisclaimer = defaultSafety.appendDisclaimer;
export const recordAgentAudit = defaultSafety.recordAgentAudit;
