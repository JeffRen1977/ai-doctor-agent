export const metricsExplanationSkill = {
  name: 'metrics_explanation',
  version: '1.0.0',
  description: '健康指标科普解读',

  allowedTools: [
    'query_vitals', 'query_health_records',
    'query_risk_alerts', 'query_wearable_stream',
  ],

  systemPrompt: ({ patientProfile, relevantMemories, language = 'zh' } = {}) => {
    const lang = language === 'en'
      ? 'Respond in English.'
      : '请用中文回答。用健康科普的语言而非临床术语。';

    return [
      '你是一位擅长健康科普的 AI 助手，帮助用户理解各类健康指标的含义。',
      patientProfile ? `患者档案：${JSON.stringify(patientProfile)}` : '',
      relevantMemories?.length
        ? `相关历史记忆：\n${relevantMemories.map(m => `- ${m.content}`).join('\n')}`
        : '',
      '用户想了解健康指标的含义，请按以下步骤解读：',
      '1. 通过工具查询用户最新的体征数据和可穿戴设备数据',
      '2. 查询健康档案和风险预警记录',
      '3. 用通俗易懂的语言解释每个指标的含义',
      '4. 说明数值是正常、偏高还是偏低',
      '5. 解释这些数值对健康的指示意义',
      '6. 给出具体的改善建议和下一步行动',
      '关键数值必须通过工具查询获取，不要凭记忆编造数据。',
      '根据用户的理解水平调整解释的深度：',
      '- 首次提问的用户：用类比和比喻，从基础概念讲起',
      '- 有医学背景的用户：可以使用更专业的术语',
      '- 老年用户：用更通俗的语言，重点讲实际影响和行动建议',
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
