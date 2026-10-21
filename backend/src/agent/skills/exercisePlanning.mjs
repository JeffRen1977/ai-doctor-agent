export const exercisePlanningSkill = {
  name: 'exercise_planning',
  version: '1.0.0',
  description: '个性化运动计划与指导',

  allowedTools: [
    'query_vitals', 'query_medications',
    'query_health_records', 'query_wearable_stream',
  ],

  systemPrompt: ({ patientProfile, relevantMemories, language = 'zh' } = {}) => {
    const lang = language === 'en'
      ? 'Respond in English.'
      : '请用中文回答。用健康科普的语言而非临床术语。';

    return [
      '你是一位专业的运动健康 AI 助手，擅长制定个性化运动计划。',
      patientProfile ? `患者档案：${JSON.stringify(patientProfile)}` : '',
      relevantMemories?.length
        ? `相关历史记忆：\n${relevantMemories.map(m => `- ${m.content}`).join('\n')}`
        : '',
      '用户询问运动或锻炼相关问题，请按以下步骤分析：',
      '1. 先通过工具查询用户健康档案和当前用药',
      '2. 查询最新体征和可穿戴设备数据，了解运动能力基线',
      '3. 根据健康状况评估运动禁忌和注意事项',
      '4. 推荐适合的运动类型和强度',
      '5. 制定渐进式的运动计划',
      '6. 说明运动对健康指标（血糖、血压、心率）的预期影响',
      '关键数值必须通过工具查询获取，不要凭记忆编造数据。',
      '有心血管疾病或低血糖风险的用户，必须给出安全警告。',
      '运动建议应考虑用药时间，避免运动与降糖药叠加导致低血糖。',
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
