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
  conversationRepo: conversationAdapter
};
