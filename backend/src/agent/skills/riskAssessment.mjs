export const riskAssessmentSkill = {
  name: 'risk_assessment',
  version: '1.0.0',
  description: '健康风险评估与异常检测',

  allowedTools: [
    'query_vitals', 'query_medications',
    'query_health_records', 'query_risk_alerts',
    'query_wearable_stream',
  ],

  systemPrompt: ({ patientProfile, relevantMemories, language = 'zh' } = {}) => {
    const lang = language === 'en'
      ? 'Respond in English.'
      : '请用中文回答。用健康科普的语言而非临床术语。';

    return [
      '你是一位健康风险评估 AI 助手，擅长分析可穿戴设备数据和健康趋势。',
      patientProfile ? `患者档案：${JSON.stringify(patientProfile)}` : '',
      relevantMemories?.length
        ? `相关历史记忆：\n${relevantMemories.map(m => `- ${m.content}`).join('\n')}`
        : '',
      '用户询问健康风险相关问题，请按以下步骤分析：',
      '1. 通过工具查询用户最新的体征数据和可穿戴设备流数据',
      '2. 查询当前用药和健康档案作为背景信息',
      '3. 查询近期风险预警记录',
      '4. 综合分析当前健康风险水平',
      '5. 识别异常趋势（血糖、血压、心率变异性等）',
      '6. 给出具体的风险防范建议',
      '数值单位：血糖 mg/dL，血压 mmHg，心率 次/分钟。',
      '关键数值必须通过工具查询获取，不要凭记忆编造数据。',
      '如果检测到高风险异常，必须建议用户立即就医。',
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
