/**
 * Firebase Adapter: 导出各 Repository 实现
 * 步骤 2～4 将补充 medicationRepo、vitalsDailyRepo、chatSessionRepo
 */

const userBasicInfoAdapter = require('./userBasicInfoAdapter');

module.exports = {
  userBasicInfoRepo: userBasicInfoAdapter,
  medicationRepo: null,
  vitalsDailyRepo: null,
  chatSessionRepo: null
};
