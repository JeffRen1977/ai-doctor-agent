/**
 * 根据 PERSISTENCE_ADAPTER 选择并导出当前数据库适配器提供的 Repository 实现
 * 含 "mongo" 即视为 mongodb，避免大小写、空格或 BOM 导致仍加载 firebase
 */
const raw = String(process.env.PERSISTENCE_ADAPTER || 'firebase').trim();
const adapterName = /mongo/i.test(raw) ? 'mongodb' : (raw || 'firebase');
if (process.env.NODE_ENV !== 'production') {
  console.log('[adapters] PERSISTENCE_ADAPTER="' + raw + '" → 加载 ' + adapterName);
}
const adapters = require(`./${adapterName}`);

module.exports = adapters;
