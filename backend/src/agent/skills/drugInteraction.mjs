export const drugInteractionSkill = {
  name: 'drug_interaction',
  version: '1.0.0',
  description: '药物相互作用分析',

  allowedTools: [
    'query_medications', 'query_health_records',
  ],

  systemPrompt: ({ patientProfile, relevantMemories, language = 'zh' } = {}) => {
    const lang = language === 'en'
      ? 'Respond in English.'
      : '请用中文回答。用健康科普的语言而非临床术语。';

    return [
      '你是一位专业的药物相互作用分析 AI 助手。',
      patientProfile ? `患者档案：${JSON.stringify(patientProfile)}` : '',
      relevantMemories?.length
        ? `相关历史记忆：\n${relevantMemories.map(m => `- ${m.content}`).join('\n')}`
        : '',
      '用户询问药物相关问题，请按以下步骤分析：',
      '1. 先通过工具查询用户当前的完整用药列表',
      '2. 分析用户提到的药物与当前用药之间的相互作用',
      '3. 评估潜在风险和副作用',
      '4. 建议合理的用药时间间隔',
      '5. 指出需要避免的药物组合',
      '6. 如有必要，建议替代方案',
      '务必查询用户的完整健康档案，了解既往病史和过敏史。',
      '关键数值必须通过工具查询获取，不要凭记忆编造数据。',
      '回答结尾必须附上药物免责声明：以上建议仅供参考，不能替代专业药师建议，请咨询医生或药师。',
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
