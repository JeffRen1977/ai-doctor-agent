/**
 * 根据 PERSISTENCE_ADAPTER 选择并导出当前数据库适配器提供的 Repository 实现
 */

const adapterName = process.env.PERSISTENCE_ADAPTER || 'firebase';
const adapters = require(`./${adapterName}`);

module.exports = adapters;
