/**
 * Firebase Adapter: 导出各 Repository 实现
 */

const userBasicInfoAdapter = require('./userBasicInfoAdapter');
const medicationAdapter = require('./medicationAdapter');
const vitalsDailyAdapter = require('./vitalsDailyAdapter');
const chatSessionAdapter = require('./chatSessionAdapter');
const interventionAdapter = require('./interventionAdapter');
const exercisePlanAdapter = require('./exercisePlanAdapter');
const nutritionAnalysisAdapter = require('./nutritionAnalysisAdapter');
const riskAlertAdapter = require('./riskAlertAdapter');
const notificationAdapter = require('./notificationAdapter');
const rehabilitationRecordAdapter = require('./rehabilitationRecordAdapter');
const rehabilitationFeedbackAdapter = require('./rehabilitationFeedbackAdapter');
const conversationAdapter = require('./conversationAdapter');
const reportAdapter = require('./reportAdapter');
const riskMonitoringStateAdapter = require('./riskMonitoringStateAdapter');
const appointmentAdapter = require('./appointmentAdapter');
const emergencyContactAdapter = require('./emergencyContactAdapter');
const emergencyAlertAdapter = require('./emergencyAlertAdapter');
const userSettingsAdapter = require('./userSettingsAdapter');
const userWearablesAdapter = require('./userWearablesAdapter');
const digitalTwinAdapter = require('./digitalTwinAdapter');
const wearableStreamDataAdapter = require('./wearableStreamDataAdapter');
const chatHistoryAdapter = require('./chatHistoryAdapter');
const healthRecordAdapter = require('./healthRecordAdapter');
const personalHealthRecordAdapter = require('./personalHealthRecordAdapter');
const userAdapter = require('./userAdapter');
const userProfileAdapter = require('./userProfileAdapter');
const healthSummaryAdapter = require('./healthSummaryAdapter');
const telegramBindingAdapter = require('./telegramBindingAdapter');
const auditEventAdapter = require('./auditEventAdapter');

module.exports = {
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
  healthSummaryRepo: healthSummaryAdapter,
  telegramBindingRepo: telegramBindingAdapter,
  auditEventRepo: auditEventAdapter
};
