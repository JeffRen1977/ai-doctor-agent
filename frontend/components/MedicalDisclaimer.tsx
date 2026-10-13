import React from 'react';
import { Alert } from 'antd';
import { useLanguageStore } from '../stores/languageStore';

const disclaimers: Record<string, Record<string, string>> = {
  general: {
    zh: '以上内容由AI生成，仅供健康参考，不构成医疗诊断或治疗建议。如有健康问题，请及时就医并遵从专业医生的指导。',
    en: 'The above content is AI-generated and is for health reference only. It does not constitute medical diagnosis or treatment advice. Please consult a qualified healthcare professional if you have health concerns.'
  },
  medication: {
    zh: '以上药物信息由AI分析生成，仅供参考。用药方案应由执业医师或药师指导，请勿自行调整用药。',
    en: 'The above medication information is AI-generated and for reference only. Medication plans should be guided by a licensed physician or pharmacist.'
  },
  diagnosis: {
    zh: '以上分析由AI辅助生成，不能替代专业医疗诊断。确切诊断需由医疗机构通过专业检查确定。',
    en: 'The above analysis is AI-assisted and cannot replace professional medical diagnosis. Definitive diagnosis requires professional examination at a medical institution.'
  },
  rehabilitation: {
    zh: '以上康复建议由AI生成，仅供参考。康复方案应根据个人身体状况由专业康复医师制定。',
    en: 'The above rehabilitation suggestions are AI-generated and for reference only. Rehabilitation plans should be developed by a professional rehabilitation physician.'
  }
};

interface MedicalDisclaimerProps {
  category?: 'general' | 'medication' | 'diagnosis' | 'rehabilitation';
  style?: React.CSSProperties;
}

const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  category = 'general',
  style
}) => {
  const { language } = useLanguageStore();
  const lang = language === 'en' ? 'en' : 'zh';
  const text = disclaimers[category]?.[lang] || disclaimers.general[lang];
  const title = lang === 'zh' ? '医疗免责声明' : 'Medical Disclaimer';

  return (
    <Alert
      message={title}
      description={text}
      type="warning"
      showIcon
      style={{ marginTop: 16, ...style }}
    />
  );
};

export default MedicalDisclaimer;
