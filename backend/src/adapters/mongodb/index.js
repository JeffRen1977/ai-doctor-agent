/**
 * MongoDB Adapter 门面
 * 已实现的 repo 用 mongodb 实现；未实现的暂时用 firebase 兜底，后续可逐步替换。
 */
const firebase = require('../firebase');

const healthSummaryAdapter = require('./healthSummaryAdapter');

module.exports = {
  userBasicInfoRepo: firebase.userBasicInfoRepo,
  medicationRepo: firebase.medicationRepo,
  vitalsDailyRepo: firebase.vitalsDailyRepo,
  chatSessionRepo: firebase.chatSessionRepo,
  interventionRepo: firebase.interventionRepo,
  exercisePlanRepo: firebase.exercisePlanRepo,
  nutritionAnalysisRepo: firebase.nutritionAnalysisRepo,
  riskAlertRepo: firebase.riskAlertRepo,
  notificationRepo: firebase.notificationRepo,
  rehabilitationRecordRepo: firebase.rehabilitationRecordRepo,
  rehabilitationFeedbackRepo: firebase.rehabilitationFeedbackRepo,
  conversationRepo: firebase.conversationRepo,
  reportRepo: firebase.reportRepo,
  riskMonitoringStateRepo: firebase.riskMonitoringStateRepo,
  appointmentRepo: firebase.appointmentRepo,
  emergencyContactRepo: firebase.emergencyContactRepo,
  emergencyAlertRepo: firebase.emergencyAlertRepo,
  userSettingsRepo: firebase.userSettingsRepo,
  userWearablesRepo: firebase.userWearablesRepo,
  digitalTwinRepo: firebase.digitalTwinRepo,
  wearableStreamDataRepo: firebase.wearableStreamDataRepo,
  chatHistoryRepo: firebase.chatHistoryRepo,
  healthRecordRepo: firebase.healthRecordRepo,
  personalHealthRecordRepo: firebase.personalHealthRecordRepo,
  userRepo: firebase.userRepo,
  userProfileRepo: firebase.userProfileRepo,
  healthSummaryRepo: healthSummaryAdapter
};
