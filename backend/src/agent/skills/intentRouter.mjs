const DRUG_NAME_PATTERNS = [
  /阿司匹林/, /布洛芬/, /头孢/, /二甲双胍/, /阿莫西林/, /青霉素/,
  /氯雷他定/, /奥美拉唑/, /硝苯地平/, /氨氯地平/, /辛伐他汀/,
  /阿托伐他汀/, /美托洛尔/, /氢氯噻嗪/, /华法林/, /地高辛/,
  /甲硝唑/, /左氧氟沙星/, /头孢克洛/, /头孢拉定/, /对乙酰氨基酚/,
  /aspirin/i, /ibuprofen/i, /metformin/i, /cephalosporin/i,
  /amoxicillin/i, /warfarin/i, /acetaminophen/i, /omeprazole/i,
  /atorvastatin/i, /lisinopril/i,
];

const INTENT_RULES = [
  {
    skillName: 'drug_interaction',
    priority: 30,
    patterns: [
      /药物相互作用/, /能一起吃/, /药物冲突/, /同服/, /联合用药/,
      /配伍/, /禁忌/, /副作用/, /不良反应/, /药物.*搭配/,
      /interaction/i, /drug.*interact/i, /take.*together/i,
      /combine.*medic/i, /side.*effect/i, /contraindic/i,
    ],
  },
  {
    skillName: 'emotional_support',
    priority: 25,
    patterns: [
      /焦虑/, /抑郁/, /情绪低落/, /心情不好/, /压力大/, /烦躁/,
      /崩溃/, /绝望/, /害怕/, /恐慌/, /紧张/, /难过/, /伤心/,
      /睡不着.*心情|心情.*睡不着/, /不想.*活/, /活着.*没意思/,
      /心理/, /情绪/, /心态/, /郁闷/, /烦恼/,
      /anxious/i, /depress/i, /stress/i, /overwhelm/i, /panic/i,
      /emotion/i, /mental.*health/i, /feeling.*down/i, /mood/i,
      /scared/i, /hopeless/i, /worried.*constant/i,
    ],
  },
  {
    skillName: 'symptom_analysis',
    priority: 20,
    patterns: [
      /症状/, /头疼/, /头痛/, /肚子疼/, /腹痛/, /胸闷/, /胸痛/,
      /发烧/, /发热/, /咳嗽/, /恶心/, /呕吐/, /疼痛/, /不舒服/,
      /浑身/, /乏力/, /失眠/, /眩晕/, /腹泻/, /便秘/, /气短/,
      /symptom/i, /headache/i, /fever/i, /cough/i, /pain/i,
      /nausea|nauseous/i, /dizz/i, /fatigue/i, /insomnia/i, /vomit/i,
    ],
  },
  {
    skillName: 'nutrition_analysis',
    priority: 15,
    patterns: [
      /营养/, /饮食/, /吃什么/, /食谱/, /热量/, /卡路里/,
      /碳水/, /蛋白质/, /脂肪/, /膳食/, /早餐|午餐|晚餐/,
      /减肥.*吃/, /血糖.*吃/, /糖尿病.*饮食/, /忌口/,
      /nutrition/i, /diet/i, /calorie/i, /meal/i, /food.*recommend/i,
      /what.*eat/i, /carb/i, /protein/i, /breakfast|lunch|dinner/i,
    ],
  },
  {
    skillName: 'exercise_planning',
    priority: 15,
    patterns: [
      /运动/, /锻炼/, /健身/, /跑步/, /散步/, /游泳/,
      /瑜伽/, /太极/, /步数/, /有氧/, /力量.*训练/,
      /运动.*计划/, /运动.*建议/, /能不能运动/, /运动.*强度/,
      /exercise/i, /workout/i, /fitness/i, /running/i, /walking/i,
      /yoga/i, /swimming/i, /physical.*activ/i, /training.*plan/i,
    ],
  },
  {
    skillName: 'metrics_explanation',
    priority: 12,
    patterns: [
      /指标.*什么意思/, /指标.*解读/, /指标.*正常/, /指标.*偏高|偏低/,
      /报告.*看不懂/, /报告.*解释/, /检查.*结果/, /化验.*结果/,
      /什么是.*HbA1c|HbA1c.*什么/, /糖化血红蛋白/,
      /什么是.*血脂|血脂.*什么/, /什么是.*肌酐|肌酐.*什么/,
      /正常范围/, /参考值/, /数值.*含义/,
      /explain.*metric/i, /what.*(?:does|is).*(?:level|value|reading)/i,
      /test.*result/i, /lab.*result/i, /normal.*range/i,
      /what.*HbA1c/i, /understand.*report/i,
    ],
  },
  {
    skillName: 'risk_assessment',
    priority: 10,
    patterns: [
      /风险评估/, /异常检测/, /血糖预测/, /低血糖/, /心率变异/,
      /健康风险/, /预警/, /趋势分析/, /心率.*异常/, /血压.*异常/,
      /血压.*高/, /血糖.*低/,
      /risk.*assess/i, /anomal/i, /hypoglycemia/i, /\bhrv\b/i,
      /health.*alert/i, /vital.*trend/i,
    ],
  },
];

function mentionsDrug(text) {
  return DRUG_NAME_PATTERNS.some(p => p.test(text));
}

export function classifyIntent(message, skillRegistry) {
  const text = message || '';

  const matched = [];
  for (const rule of INTENT_RULES) {
    if (!skillRegistry.has(rule.skillName)) continue;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        matched.push(rule);
        break;
      }
    }
  }

  if (matched.length === 0) return skillRegistry.getDefault().name;

  const hasDrugName = mentionsDrug(text);
  const hasSymptomSkill = matched.some(m => m.skillName === 'symptom_analysis');
  const hasDrugSkill = matched.some(m => m.skillName === 'drug_interaction');

  if (hasSymptomSkill && !hasDrugSkill && hasDrugName && skillRegistry.has('drug_interaction')) {
    return 'drug_interaction';
  }

  if (matched.length === 1) return matched[0].skillName;

  matched.sort((a, b) => b.priority - a.priority);
  return matched[0].skillName;
}

export { DRUG_NAME_PATTERNS as _DRUG_NAME_PATTERNS_FOR_TEST };
