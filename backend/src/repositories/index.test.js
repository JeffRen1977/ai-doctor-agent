/**
 * Unit tests: repositories facade (colocated with source)
 * See docs/data-format/IMPLEMENTATION_STEPS_DETAILED.md Step 1.4
 */

jest.mock('../adapters', () => ({
  userBasicInfoRepo: {
    getBasicInfo: jest.fn(),
    getBasicInfoForAgent: jest.fn(),
    saveBasicInfo: jest.fn(),
    getFullHealthRecord: jest.fn()
  },
  medicationRepo: null,
  vitalsDailyRepo: null,
  chatSessionRepo: null,
  interventionRepo: {
    getIntervention: jest.fn(),
    setIntervention: jest.fn()
  },
  exercisePlanRepo: {
    getExercisePlan: jest.fn(),
    setExercisePlan: jest.fn()
  },
  nutritionAnalysisRepo: {
    addNutritionAnalysis: jest.fn()
  },
  riskAlertRepo: {
    addAlert: jest.fn(),
    getRecentAlertsByUser: jest.fn(),
    acknowledgeAlert: jest.fn()
  },
  notificationRepo: {
    addNotification: jest.fn()
  },
  rehabilitationRecordRepo: {
    addRehabilitationRecord: jest.fn(),
    getRehabilitationRecords: jest.fn(),
    updateRehabilitationRecordFeedback: jest.fn()
  },
  rehabilitationFeedbackRepo: {
    addRehabilitationFeedback: jest.fn()
  },
  conversationRepo: {
    getActiveConversationsByUser: jest.fn()
  }
}));

describe('repositories/index.js facade', () => {
  test('require 得到对象且含 userBasicInfoRepo', () => {
    const repos = require('./index');
    expect(typeof repos).toBe('object');
    expect(repos.userBasicInfoRepo).toBeDefined();
  });

  test('userBasicInfoRepo 有 getBasicInfo、getBasicInfoForAgent、saveBasicInfo、getFullHealthRecord 方法', () => {
    const repos = require('./index');
    expect(typeof repos.userBasicInfoRepo.getBasicInfo).toBe('function');
    expect(typeof repos.userBasicInfoRepo.getBasicInfoForAgent).toBe('function');
    expect(typeof repos.userBasicInfoRepo.saveBasicInfo).toBe('function');
    expect(typeof repos.userBasicInfoRepo.getFullHealthRecord).toBe('function');
  });

  test('导出 medicationRepo、vitalsDailyRepo、chatSessionRepo、interventionRepo、exercisePlanRepo、nutritionAnalysisRepo、riskAlertRepo、notificationRepo、rehabilitationRecordRepo、rehabilitationFeedbackRepo、conversationRepo', () => {
    const repos = require('./index');
    expect('medicationRepo' in repos).toBe(true);
    expect('vitalsDailyRepo' in repos).toBe(true);
    expect('chatSessionRepo' in repos).toBe(true);
    expect('interventionRepo' in repos).toBe(true);
    expect('exercisePlanRepo' in repos).toBe(true);
    expect('nutritionAnalysisRepo' in repos).toBe(true);
    expect('riskAlertRepo' in repos).toBe(true);
    expect('notificationRepo' in repos).toBe(true);
    expect('rehabilitationRecordRepo' in repos).toBe(true);
    expect('rehabilitationFeedbackRepo' in repos).toBe(true);
    expect('conversationRepo' in repos).toBe(true);
  });

  test('interventionRepo 有 getIntervention、setIntervention 方法', () => {
    const repos = require('./index');
    expect(typeof repos.interventionRepo.getIntervention).toBe('function');
    expect(typeof repos.interventionRepo.setIntervention).toBe('function');
  });

  test('exercisePlanRepo 有 getExercisePlan、setExercisePlan 方法', () => {
    const repos = require('./index');
    expect(typeof repos.exercisePlanRepo.getExercisePlan).toBe('function');
    expect(typeof repos.exercisePlanRepo.setExercisePlan).toBe('function');
  });

  test('nutritionAnalysisRepo 有 addNutritionAnalysis 方法', () => {
    const repos = require('./index');
    expect(typeof repos.nutritionAnalysisRepo.addNutritionAnalysis).toBe('function');
  });

  test('riskAlertRepo 有 addAlert、getRecentAlertsByUser、acknowledgeAlert 方法', () => {
    const repos = require('./index');
    expect(typeof repos.riskAlertRepo.addAlert).toBe('function');
    expect(typeof repos.riskAlertRepo.getRecentAlertsByUser).toBe('function');
    expect(typeof repos.riskAlertRepo.acknowledgeAlert).toBe('function');
  });

  test('notificationRepo 有 addNotification 方法', () => {
    const repos = require('./index');
    expect(typeof repos.notificationRepo.addNotification).toBe('function');
  });

  test('rehabilitationRecordRepo 有 addRehabilitationRecord、getRehabilitationRecords、updateRehabilitationRecordFeedback 方法', () => {
    const repos = require('./index');
    expect(typeof repos.rehabilitationRecordRepo.addRehabilitationRecord).toBe('function');
    expect(typeof repos.rehabilitationRecordRepo.getRehabilitationRecords).toBe('function');
    expect(typeof repos.rehabilitationRecordRepo.updateRehabilitationRecordFeedback).toBe('function');
  });

  test('rehabilitationFeedbackRepo 有 addRehabilitationFeedback 方法', () => {
    const repos = require('./index');
    expect(typeof repos.rehabilitationFeedbackRepo.addRehabilitationFeedback).toBe('function');
  });

  test('conversationRepo 有 getActiveConversationsByUser 方法', () => {
    const repos = require('./index');
    expect(typeof repos.conversationRepo.getActiveConversationsByUser).toBe('function');
  });
});
