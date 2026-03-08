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
    getActiveConversationsByUser: jest.fn(),
    saveConversation: jest.fn(),
    getConversation: jest.fn(),
    listByUser: jest.fn(),
    updateConversation: jest.fn(),
    deleteConversation: jest.fn()
  },
  reportRepo: {
    saveReport: jest.fn(),
    getReport: jest.fn(),
    listReportsByUser: jest.fn()
  },
  riskMonitoringStateRepo: {
    getRiskMonitoringState: jest.fn(),
    setRiskMonitoringState: jest.fn()
  },
  appointmentRepo: {
    saveAppointment: jest.fn(),
    getAppointment: jest.fn(),
    updateAppointment: jest.fn(),
    deleteAppointment: jest.fn(),
    listAppointmentsByUser: jest.fn()
  },
  emergencyContactRepo: {
    saveContact: jest.fn(),
    getContact: jest.fn(),
    listByUser: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn(),
    unsetPrimaryForUser: jest.fn()
  },
  emergencyAlertRepo: {
    saveAlert: jest.fn(),
    getAlert: jest.fn(),
    listByUser: jest.fn(),
    updateAlert: jest.fn()
  },
  userSettingsRepo: {
    getUserSettings: jest.fn(),
    setUserSettings: jest.fn()
  },
  userWearablesRepo: {
    getUserWearables: jest.fn(),
    setUserWearables: jest.fn(),
    listHistoryByUser: jest.fn()
  },
  digitalTwinRepo: {
    getDigitalTwin: jest.fn(),
    setDigitalTwin: jest.fn()
  },
  wearableStreamDataRepo: {
    addDataPoint: jest.fn(),
    getRecentByUser: jest.fn(),
    listByUserInTimeRange: jest.fn()
  },
  chatHistoryRepo: {
    addDocument: jest.fn(),
    getDocument: jest.fn(),
    listAll: jest.fn(),
    getByUser: jest.fn(),
    setByUser: jest.fn()
  },
  healthRecordRepo: {
    getByUser: jest.fn(),
    setByUser: jest.fn(),
    listByUser: jest.fn()
  },
  personalHealthRecordRepo: {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn()
  },
  userRepo: {
    getByEmail: jest.fn(),
    setByEmail: jest.fn(),
    updateByEmail: jest.fn(),
    getByUid: jest.fn()
  },
  userProfileRepo: {
    getByEmail: jest.fn(),
    setByEmail: jest.fn(),
    updateByEmail: jest.fn()
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

  test('导出 appointmentRepo、emergencyContactRepo、emergencyAlertRepo、userSettingsRepo、userWearablesRepo、digitalTwinRepo 及原有 repos', () => {
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
    expect('reportRepo' in repos).toBe(true);
    expect('riskMonitoringStateRepo' in repos).toBe(true);
    expect('appointmentRepo' in repos).toBe(true);
    expect('emergencyContactRepo' in repos).toBe(true);
    expect('emergencyAlertRepo' in repos).toBe(true);
    expect('userSettingsRepo' in repos).toBe(true);
    expect('userWearablesRepo' in repos).toBe(true);
    expect('digitalTwinRepo' in repos).toBe(true);
    expect('wearableStreamDataRepo' in repos).toBe(true);
    expect('chatHistoryRepo' in repos).toBe(true);
    expect('healthRecordRepo' in repos).toBe(true);
    expect('personalHealthRecordRepo' in repos).toBe(true);
    expect('userRepo' in repos).toBe(true);
    expect('userProfileRepo' in repos).toBe(true);
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

  test('conversationRepo 有 getActiveConversationsByUser、saveConversation、getConversation、listByUser、updateConversation、deleteConversation 方法', () => {
    const repos = require('./index');
    expect(typeof repos.conversationRepo.getActiveConversationsByUser).toBe('function');
    expect(typeof repos.conversationRepo.saveConversation).toBe('function');
    expect(typeof repos.conversationRepo.getConversation).toBe('function');
    expect(typeof repos.conversationRepo.listByUser).toBe('function');
    expect(typeof repos.conversationRepo.updateConversation).toBe('function');
    expect(typeof repos.conversationRepo.deleteConversation).toBe('function');
  });

  test('reportRepo 有 saveReport、getReport、listReportsByUser 方法', () => {
    const repos = require('./index');
    expect(typeof repos.reportRepo.saveReport).toBe('function');
    expect(typeof repos.reportRepo.getReport).toBe('function');
    expect(typeof repos.reportRepo.listReportsByUser).toBe('function');
  });

  test('riskMonitoringStateRepo 有 getRiskMonitoringState、setRiskMonitoringState 方法', () => {
    const repos = require('./index');
    expect(typeof repos.riskMonitoringStateRepo.getRiskMonitoringState).toBe('function');
    expect(typeof repos.riskMonitoringStateRepo.setRiskMonitoringState).toBe('function');
  });

  test('appointmentRepo 有 saveAppointment、getAppointment、updateAppointment、deleteAppointment、listAppointmentsByUser 方法', () => {
    const repos = require('./index');
    expect(typeof repos.appointmentRepo.saveAppointment).toBe('function');
    expect(typeof repos.appointmentRepo.getAppointment).toBe('function');
    expect(typeof repos.appointmentRepo.updateAppointment).toBe('function');
    expect(typeof repos.appointmentRepo.deleteAppointment).toBe('function');
    expect(typeof repos.appointmentRepo.listAppointmentsByUser).toBe('function');
  });

  test('emergencyContactRepo 有 saveContact、getContact、listByUser、updateContact、deleteContact、unsetPrimaryForUser 方法', () => {
    const repos = require('./index');
    expect(typeof repos.emergencyContactRepo.saveContact).toBe('function');
    expect(typeof repos.emergencyContactRepo.getContact).toBe('function');
    expect(typeof repos.emergencyContactRepo.listByUser).toBe('function');
    expect(typeof repos.emergencyContactRepo.updateContact).toBe('function');
    expect(typeof repos.emergencyContactRepo.deleteContact).toBe('function');
    expect(typeof repos.emergencyContactRepo.unsetPrimaryForUser).toBe('function');
  });

  test('emergencyAlertRepo 有 saveAlert、getAlert、listByUser、updateAlert 方法', () => {
    const repos = require('./index');
    expect(typeof repos.emergencyAlertRepo.saveAlert).toBe('function');
    expect(typeof repos.emergencyAlertRepo.getAlert).toBe('function');
    expect(typeof repos.emergencyAlertRepo.listByUser).toBe('function');
    expect(typeof repos.emergencyAlertRepo.updateAlert).toBe('function');
  });

  test('userSettingsRepo 有 getUserSettings、setUserSettings 方法', () => {
    const repos = require('./index');
    expect(typeof repos.userSettingsRepo.getUserSettings).toBe('function');
    expect(typeof repos.userSettingsRepo.setUserSettings).toBe('function');
  });

  test('userWearablesRepo 有 getUserWearables、setUserWearables、listHistoryByUser 方法', () => {
    const repos = require('./index');
    expect(typeof repos.userWearablesRepo.getUserWearables).toBe('function');
    expect(typeof repos.userWearablesRepo.setUserWearables).toBe('function');
    expect(typeof repos.userWearablesRepo.listHistoryByUser).toBe('function');
  });

  test('digitalTwinRepo 有 getDigitalTwin、setDigitalTwin 方法', () => {
    const repos = require('./index');
    expect(typeof repos.digitalTwinRepo.getDigitalTwin).toBe('function');
    expect(typeof repos.digitalTwinRepo.setDigitalTwin).toBe('function');
  });

  test('wearableStreamDataRepo 有 addDataPoint、getRecentByUser、listByUserInTimeRange 方法', () => {
    const repos = require('./index');
    expect(typeof repos.wearableStreamDataRepo.addDataPoint).toBe('function');
    expect(typeof repos.wearableStreamDataRepo.getRecentByUser).toBe('function');
    expect(typeof repos.wearableStreamDataRepo.listByUserInTimeRange).toBe('function');
  });

  test('chatHistoryRepo 有 addDocument、getDocument、listAll、getByUser、setByUser 方法', () => {
    const repos = require('./index');
    expect(typeof repos.chatHistoryRepo.addDocument).toBe('function');
    expect(typeof repos.chatHistoryRepo.getDocument).toBe('function');
    expect(typeof repos.chatHistoryRepo.listAll).toBe('function');
    expect(typeof repos.chatHistoryRepo.getByUser).toBe('function');
    expect(typeof repos.chatHistoryRepo.setByUser).toBe('function');
  });

  test('healthRecordRepo 有 getByUser、setByUser、listByUser 方法', () => {
    const repos = require('./index');
    expect(typeof repos.healthRecordRepo.getByUser).toBe('function');
    expect(typeof repos.healthRecordRepo.setByUser).toBe('function');
    expect(typeof repos.healthRecordRepo.listByUser).toBe('function');
  });

  test('personalHealthRecordRepo 有 get、set、update 方法', () => {
    const repos = require('./index');
    expect(typeof repos.personalHealthRecordRepo.get).toBe('function');
    expect(typeof repos.personalHealthRecordRepo.set).toBe('function');
    expect(typeof repos.personalHealthRecordRepo.update).toBe('function');
  });

  test('userRepo 有 getByEmail、setByEmail、updateByEmail、getByUid 方法', () => {
    const repos = require('./index');
    expect(typeof repos.userRepo.getByEmail).toBe('function');
    expect(typeof repos.userRepo.setByEmail).toBe('function');
    expect(typeof repos.userRepo.updateByEmail).toBe('function');
    expect(typeof repos.userRepo.getByUid).toBe('function');
  });

  test('userProfileRepo 有 getByEmail、setByEmail、updateByEmail 方法', () => {
    const repos = require('./index');
    expect(typeof repos.userProfileRepo.getByEmail).toBe('function');
    expect(typeof repos.userProfileRepo.setByEmail).toBe('function');
    expect(typeof repos.userProfileRepo.updateByEmail).toBe('function');
  });
});
