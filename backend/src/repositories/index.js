/**
 * Repository 门面：导出当前 Adapter 提供的实现
 * 业务层 require('./repositories') 或 require('../repositories') 即可获得可用的 repo，无需关心底层是 Firebase 还是其他库
 */

const adapters = require('../adapters');

module.exports = {
  userBasicInfoRepo: adapters.userBasicInfoRepo,
  medicationRepo: adapters.medicationRepo,
  vitalsDailyRepo: adapters.vitalsDailyRepo,
  chatSessionRepo: adapters.chatSessionRepo,
  interventionRepo: adapters.interventionRepo,
  exercisePlanRepo: adapters.exercisePlanRepo,
  nutritionAnalysisRepo: adapters.nutritionAnalysisRepo,
  riskAlertRepo: adapters.riskAlertRepo,
  notificationRepo: adapters.notificationRepo,
  rehabilitationRecordRepo: adapters.rehabilitationRecordRepo,
  rehabilitationFeedbackRepo: adapters.rehabilitationFeedbackRepo,
  conversationRepo: adapters.conversationRepo,
  reportRepo: adapters.reportRepo
};
