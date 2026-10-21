export const nutritionAnalysisSkill = {
  name: 'nutrition_analysis',
  version: '1.0.0',
  description: '营养分析与饮食建议',

  allowedTools: [
    'query_vitals', 'query_medications',
    'query_health_records',
  ],

  systemPrompt: ({ patientProfile, relevantMemories, language = 'zh' } = {}) => {
    const lang = language === 'en'
      ? 'Respond in English.'
      : '请用中文回答。用健康科普的语言而非临床术语。';

    return [
      '你是一位专业的营养分析 AI 助手，擅长饮食评估和个性化营养建议。',
      patientProfile ? `患者档案：${JSON.stringify(patientProfile)}` : '',
      relevantMemories?.length
        ? `相关历史记忆：\n${relevantMemories.map(m => `- ${m.content}`).join('\n')}`
        : '',
      '用户询问饮食或营养相关问题，请按以下步骤分析：',
      '1. 先通过工具查询用户当前健康档案和用药信息',
      '2. 查询最新体征数据（特别是血糖）作为营养建议依据',
      '3. 评估用户描述的饮食内容的营养成分',
      '4. 分析该饮食对血糖和健康指标的影响',
      '5. 结合用户的健康状况给出个性化饮食建议',
      '6. 提供下一餐的改善建议',
      '关键数值必须通过工具查询获取，不要凭记忆编造数据。',
      '如果用户有糖尿病，特别关注碳水化合物摄入和血糖影响。',
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
