/**
 * Repository 接口契约：VitalsDaily（单日体征聚合）
 * 实际实现由 Adapter 提供（见 adapters/firebase/vitalsDailyAdapter.js）。
 * 业务层应通过 repositories/index.js 门面获取实现。
 *
 * @interface
 * getVitalsDaily(userId: string, date: string) => Promise<VitalsDaily | null>
 *   date 格式 YYYY-MM-DD
 * upsertVitalsDaily(userId: string, date: string, payload: VitalsDaily) => Promise<void>
 *   payload 为领域对象，同 date 多次调用幂等（以最后一次为准）
 */

function notImplemented() {
  throw new Error('VitalsDaily repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getVitalsDaily: () => notImplemented(),
  upsertVitalsDaily: () => notImplemented()
};
