export const healthChatSkill = {
  name: 'health_chat',
  version: '1.0.0',
  description: '通用健康对话',

  allowedTools: [
    'query_vitals', 'query_medications',
    'query_health_records', 'query_risk_alerts',
  ],

  systemPrompt: ({ patientProfile, relevantMemories, language = 'zh' } = {}) => {
    const lang = language === 'en'
      ? 'Respond in English.'
      : '请用中文回答。用健康科普的语言而非临床术语。';

    return [
      '你是一位经验丰富的健康管家 AI 助手。',
      patientProfile ? `患者档案：${JSON.stringify(patientProfile)}` : '',
      relevantMemories?.length
        ? `相关历史记忆：\n${relevantMemories.map(m => `- ${m.content}`).join('\n')}`
        : '',
      '分析症状前必须先查询当前用药。',
      '关键数值必须通过工具查询获取，不要凭记忆编造数据。',
      '回答结尾必须附上医疗免责声明：以上建议仅供参考，不构成医疗诊断，请咨询专业医生。',
      lang,
    ].filter(Boolean).join('\n\n');
  },

  postProcess: (text) => text,

  safetyRules: {
    mustIncludeDisclaimer: true,
    maxSeverityWithoutEscalation: 'medium',
    blockedTopics: ['自杀', '自残'],
  },
};
