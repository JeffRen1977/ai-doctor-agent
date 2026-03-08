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

module.exports = {
  userBasicInfoRepo: userBasicInfoAdapter,
  medicationRepo: medicationAdapter,
  vitalsDailyRepo: vitalsDailyAdapter,
  chatSessionRepo: chatSessionAdapter,
  interventionRepo: interventionAdapter,
  exercisePlanRepo: exercisePlanAdapter,
  nutritionAnalysisRepo: nutritionAnalysisAdapter
};
