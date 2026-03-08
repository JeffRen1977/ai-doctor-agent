/**
 * Repository 接口契约：Intervention（干预方案）
 * 实际实现由 Adapter 提供（见 adapters/firebase/interventionAdapter.js）。
 * 业务层应通过 repositories/index.js 门面获取实现，不要直接 require 本文件。
 *
 * @interface
 * getIntervention(userId: string) => Promise<Object | null>
 * setIntervention(userId: string, data: Object) => Promise<void>   // merge 语义
 */

function notImplemented() {
  throw new Error('Intervention repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getIntervention: () => notImplemented(),
  setIntervention: () => notImplemented()
};
