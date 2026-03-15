/**
 * MongoDB Adapter 门面
 * 全部 27 个 repo 已用 mongodb 实现，可仅配置 MONGODB_URI 替代 Firestore。
 */
const healthSummaryAdapter = require('./healthSummaryAdapter');
const userSettingsAdapter = require('./userSettingsAdapter');
const digitalTwinAdapter = require('./digitalTwinAdapter');
const userAdapter = require('./userAdapter');
const userProfileAdapter = require('./userProfileAdapter');
const riskMonitoringStateAdapter = require('./riskMonitoringStateAdapter');
const interventionAdapter = require('./interventionAdapter');
const exercisePlanAdapter = require('./exercisePlanAdapter');
const rehabilitationRecordAdapter = require('./rehabilitationRecordAdapter');
const rehabilitationFeedbackAdapter = require('./rehabilitationFeedbackAdapter');
const nutritionAnalysisAdapter = require('./nutritionAnalysisAdapter');
const notificationAdapter = require('./notificationAdapter');
const riskAlertAdapter = require('./riskAlertAdapter');
const reportAdapter = require('./reportAdapter');
const conversationAdapter = require('./conversationAdapter');
const appointmentAdapter = require('./appointmentAdapter');
const emergencyContactAdapter = require('./emergencyContactAdapter');
const emergencyAlertAdapter = require('./emergencyAlertAdapter');
const userWearablesAdapter = require('./userWearablesAdapter');
const wearableStreamDataAdapter = require('./wearableStreamDataAdapter');
const chatHistoryAdapter = require('./chatHistoryAdapter');
const healthRecordAdapter = require('./healthRecordAdapter');
const personalHealthRecordAdapter = require('./personalHealthRecordAdapter');
const userBasicInfoAdapter = require('./userBasicInfoAdapter');
const medicationAdapter = require('./medicationAdapter');
const vitalsDailyAdapter = require('./vitalsDailyAdapter');
const chatSessionAdapter = require('./chatSessionAdapter');

/** 供 auth 路由判断：当前为 MongoDB 时使用本地认证（不经过 Firebase Auth） */
const __useMongoAuth = true;

module.exports = {
  __useMongoAuth,
  userBasicInfoRepo: userBasicInfoAdapter,
  medicationRepo: medicationAdapter,
  vitalsDailyRepo: vitalsDailyAdapter,
  chatSessionRepo: chatSessionAdapter,
  interventionRepo: interventionAdapter,
  exercisePlanRepo: exercisePlanAdapter,
  nutritionAnalysisRepo: nutritionAnalysisAdapter,
  riskAlertRepo: riskAlertAdapter,
  notificationRepo: notificationAdapter,
  rehabilitationRecordRepo: rehabilitationRecordAdapter,
  rehabilitationFeedbackRepo: rehabilitationFeedbackAdapter,
  conversationRepo: conversationAdapter,
  reportRepo: reportAdapter,
  riskMonitoringStateRepo: riskMonitoringStateAdapter,
  appointmentRepo: appointmentAdapter,
  emergencyContactRepo: emergencyContactAdapter,
  emergencyAlertRepo: emergencyAlertAdapter,
  userSettingsRepo: userSettingsAdapter,
  userWearablesRepo: userWearablesAdapter,
  digitalTwinRepo: digitalTwinAdapter,
  wearableStreamDataRepo: wearableStreamDataAdapter,
  chatHistoryRepo: chatHistoryAdapter,
  healthRecordRepo: healthRecordAdapter,
  personalHealthRecordRepo: personalHealthRecordAdapter,
  userRepo: userAdapter,
  userProfileRepo: userProfileAdapter,
  healthSummaryRepo: healthSummaryAdapter
};
