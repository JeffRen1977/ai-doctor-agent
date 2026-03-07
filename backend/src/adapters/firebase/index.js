/**
 * Firebase Adapter: 导出各 Repository 实现
 */

const userBasicInfoAdapter = require('./userBasicInfoAdapter');
const medicationAdapter = require('./medicationAdapter');

module.exports = {
  userBasicInfoRepo: userBasicInfoAdapter,
  medicationRepo: medicationAdapter,
  vitalsDailyRepo: null,
  chatSessionRepo: null
};
