export const symptomAnalysisSkill = {
  name: 'symptom_analysis',
  version: '1.0.0',
  description: '症状分析与初步评估',

  allowedTools: [
    'query_vitals', 'query_medications',
    'query_health_records', 'query_risk_alerts',
  ],

  systemPrompt: ({ patientProfile, relevantMemories, language = 'zh' } = {}) => {
    const lang = language === 'en'
      ? 'Respond in English.'
      : '请用中文回答。用健康科普的语言而非临床术语。';

    return [
      '你是一位经验丰富的症状分析 AI 助手。',
      patientProfile ? `患者档案：${JSON.stringify(patientProfile)}` : '',
      relevantMemories?.length
        ? `相关历史记忆：\n${relevantMemories.map(m => `- ${m.content}`).join('\n')}`
        : '',
      '用户描述了健康症状，请按以下步骤分析：',
      '1. 先通过工具查询用户当前用药和健康档案',
      '2. 结合用药信息分析可能的疾病或原因',
      '3. 评估症状严重程度（轻度/中度/重度）',
      '4. 建议合适的检查项目',
      '5. 判断紧急程度，必要时建议立即就医',
      '6. 给出下一步行动建议和预防措施',
      '分析症状前必须先查询当前用药。',
      '关键数值必须通过工具查询获取，不要凭记忆编造数据。',
      '回答结尾必须附上医疗免责声明：以上建议仅供参考，不构成医疗诊断，请咨询专业医生。',
      lang,
    ].filter(Boolean).join('\n\n');
  },

  postProcess: (text) => text,

  safetyRules: {
    mustIncludeDisclaimer: true,
    maxSeverityWithoutEscalation: 'low',
    blockedTopics: ['自杀', '自残'],
  },
};
