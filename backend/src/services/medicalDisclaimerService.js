const logger = require('../observability/logger');

const DISCLAIMERS = {
  general: {
    zh: '⚠️ 免责声明：以上内容由AI生成，仅供健康参考，不构成医疗诊断或治疗建议。如有健康问题，请及时就医并遵从专业医生的指导。',
    en: '⚠️ Disclaimer: The above content is AI-generated and is for health reference only. It does not constitute medical diagnosis or treatment advice. If you have health concerns, please consult a qualified healthcare professional promptly.'
  },
  medication: {
    zh: '⚠️ 用药提醒：以上药物信息由AI分析生成，仅供参考。用药方案应由执业医师或药师指导，请勿自行调整用药。如出现不良反应，请立即就医。',
    en: '⚠️ Medication Notice: The above medication information is AI-generated and for reference only. Medication plans should be guided by a licensed physician or pharmacist. Do not adjust medications on your own. Seek immediate medical attention if adverse reactions occur.'
  },
  diagnosis: {
    zh: '⚠️ 诊断提醒：以上分析由AI辅助生成，不能替代专业医疗诊断。症状分析仅供参考，确切诊断需由医疗机构通过专业检查确定。请及时到正规医疗机构就诊。',
    en: '⚠️ Diagnosis Notice: The above analysis is AI-assisted and cannot replace professional medical diagnosis. Symptom analysis is for reference only; definitive diagnosis requires professional examination at a medical institution. Please visit a qualified medical facility promptly.'
  },
  rehabilitation: {
    zh: '⚠️ 康复提醒：以上康复建议由AI生成，仅供参考。康复方案应根据个人身体状况由专业康复医师制定。如在康复过程中出现不适，请立即停止并就医。',
    en: '⚠️ Rehabilitation Notice: The above rehabilitation suggestions are AI-generated and for reference only. Rehabilitation plans should be developed by a professional rehabilitation physician based on individual conditions. Stop immediately and seek medical attention if discomfort occurs during rehabilitation.'
  }
};

function getDisclaimer(category = 'general', language = 'zh') {
  const lang = language === 'en' ? 'en' : 'zh';
  const disclaimerSet = DISCLAIMERS[category] || DISCLAIMERS.general;
  return disclaimerSet[lang];
}

function detectCategory(operation) {
  if (!operation) return 'general';
  const op = operation.toLowerCase();
  if (op.includes('drug') || op.includes('medication')) return 'medication';
  if (op.includes('symptom') || op.includes('diagnosis')) return 'diagnosis';
  if (op.includes('rehabilitation') || op.includes('meditation') || op.includes('cbt') || op.includes('emotional')) return 'rehabilitation';
  return 'general';
}

function wrapResponse(text, category = 'general', language = 'zh') {
  if (!text || typeof text !== 'string') return text;
  const disclaimer = getDisclaimer(category, language);
  return `${text}\n\n${disclaimer}`;
}

function wrapAiResult(result, operation, language = 'zh') {
  if (!result || typeof result !== 'object') return result;
  if (!result.success) return result;

  const category = detectCategory(operation);
  const wrapped = { ...result };

  if (typeof wrapped.analysis === 'string') {
    wrapped.analysis = wrapResponse(wrapped.analysis, category, language);
  }
  if (typeof wrapped.message === 'string') {
    wrapped.message = wrapResponse(wrapped.message, category, language);
  }
  if (typeof wrapped.text === 'string' && !wrapped.analysis && !wrapped.message) {
    wrapped.text = wrapResponse(wrapped.text, category, language);
  }

  return wrapped;
}

module.exports = { getDisclaimer, wrapResponse, wrapAiResult, detectCategory, DISCLAIMERS };
