/**
 * Repository 接口契约：RiskMonitoringState（风险监测状态）
 * 实际实现由 Adapter 提供（见 adapters/firebase/riskMonitoringStateAdapter.js）。
 *
 * @interface
 * getRiskMonitoringState(userId: string) => Promise<Object | null>
 * setRiskMonitoringState(userId: string, data: Object) => Promise<void>   // merge 语义
 */

function notImplemented() {
  throw new Error('RiskMonitoringState repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getRiskMonitoringState: () => notImplemented(),
  setRiskMonitoringState: () => notImplemented()
};
