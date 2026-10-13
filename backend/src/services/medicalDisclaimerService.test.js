const {
  getDisclaimer,
  wrapResponse,
  wrapAiResult,
  detectCategory,
  hasDisclaimer,
  DISCLAIMERS
} = require('./medicalDisclaimerService');

describe('medicalDisclaimerService', () => {
  describe('getDisclaimer', () => {
    it('returns general Chinese disclaimer by default', () => {
      const d = getDisclaimer();
      expect(d).toBe(DISCLAIMERS.general.zh);
    });

    it('returns English disclaimer when language is en', () => {
      const d = getDisclaimer('general', 'en');
      expect(d).toBe(DISCLAIMERS.general.en);
    });

    it('returns medication disclaimer', () => {
      const d = getDisclaimer('medication', 'zh');
      expect(d).toContain('用药');
    });

    it('returns diagnosis disclaimer', () => {
      const d = getDisclaimer('diagnosis', 'zh');
      expect(d).toContain('诊断');
    });

    it('returns rehabilitation disclaimer', () => {
      const d = getDisclaimer('rehabilitation', 'zh');
      expect(d).toContain('康复');
    });

    it('falls back to general for unknown category', () => {
      const d = getDisclaimer('unknown', 'zh');
      expect(d).toBe(DISCLAIMERS.general.zh);
    });
  });

  describe('detectCategory', () => {
    it('returns medication for drug-related operations', () => {
      expect(detectCategory('checkDrugInteractions')).toBe('medication');
    });

    it('returns diagnosis for symptom operations', () => {
      expect(detectCategory('analyzeSymptoms')).toBe('diagnosis');
    });

    it('returns rehabilitation for rehabilitation operations', () => {
      expect(detectCategory('rehabilitation_guidance')).toBe('rehabilitation');
    });

    it('returns general for unknown operations', () => {
      expect(detectCategory('healthChat')).toBe('general');
    });

    it('returns general for null', () => {
      expect(detectCategory(null)).toBe('general');
    });
  });

  describe('wrapResponse', () => {
    it('appends disclaimer to text', () => {
      const result = wrapResponse('AI分析结果', 'general', 'zh');
      expect(result).toContain('AI分析结果');
      expect(result).toContain(DISCLAIMERS.general.zh);
    });

    it('returns non-string input unchanged', () => {
      expect(wrapResponse(null)).toBeNull();
      expect(wrapResponse(undefined)).toBeUndefined();
      expect(wrapResponse(123)).toBe(123);
    });

    it('returns empty string unchanged', () => {
      expect(wrapResponse('')).toBe('');
    });

    it('does not double-wrap when disclaimer already present', () => {
      const once = wrapResponse('AI分析结果', 'general', 'zh');
      const twice = wrapResponse(once, 'rehabilitation', 'zh');
      expect(twice).toBe(once);
      expect((twice.match(/⚠️/g) || []).length).toBe(1);
    });

    it('does not double-wrap with English disclaimer', () => {
      const once = wrapResponse('AI result', 'general', 'en');
      const twice = wrapResponse(once, 'medication', 'en');
      expect(twice).toBe(once);
    });
  });

  describe('hasDisclaimer', () => {
    it('returns false for plain text', () => {
      expect(hasDisclaimer('some plain text')).toBe(false);
    });

    it('returns true when text contains a disclaimer', () => {
      const wrapped = wrapResponse('test', 'general', 'zh');
      expect(hasDisclaimer(wrapped)).toBe(true);
    });

    it('returns false for null/empty', () => {
      expect(hasDisclaimer(null)).toBe(false);
      expect(hasDisclaimer('')).toBe(false);
    });
  });

  describe('wrapAiResult', () => {
    it('wraps analysis field', () => {
      const result = wrapAiResult(
        { success: true, analysis: 'test result' },
        'analyzeHealthRecords',
        'zh'
      );
      expect(result.analysis).toContain('test result');
      expect(result.analysis).toContain('免责声明');
    });

    it('wraps message field', () => {
      const result = wrapAiResult(
        { success: true, message: 'chat response' },
        'healthChat',
        'zh'
      );
      expect(result.message).toContain('chat response');
      expect(result.message).toContain('免责声明');
    });

    it('wraps text field when no analysis or message', () => {
      const result = wrapAiResult(
        { success: true, text: 'raw text' },
        'healthChat',
        'zh'
      );
      expect(result.text).toContain('raw text');
      expect(result.text).toContain('免责声明');
    });

    it('does not wrap text when analysis exists', () => {
      const result = wrapAiResult(
        { success: true, analysis: 'analysis', text: 'raw' },
        'healthChat',
        'zh'
      );
      expect(result.analysis).toContain('免责声明');
      expect(result.text).toBe('raw');
    });

    it('does not wrap failed results', () => {
      const result = wrapAiResult(
        { success: false, error: 'failed' },
        'healthChat',
        'zh'
      );
      expect(result.error).toBe('failed');
    });

    it('uses medication category for drug interactions', () => {
      const result = wrapAiResult(
        { success: true, analysis: 'drug info' },
        'checkDrugInteractions',
        'zh'
      );
      expect(result.analysis).toContain('用药');
    });

    it('uses diagnosis category for symptom analysis', () => {
      const result = wrapAiResult(
        { success: true, analysis: 'symptom info' },
        'analyzeSymptoms',
        'zh'
      );
      expect(result.analysis).toContain('诊断');
    });

    it('returns null/undefined unchanged', () => {
      expect(wrapAiResult(null, 'op')).toBeNull();
      expect(wrapAiResult(undefined, 'op')).toBeUndefined();
    });
  });
});
