/**
 * Repository 接口契约：RiskAlert（风险预警）
 * 实际实现由 Adapter 提供（见 adapters/firebase/riskAlertAdapter.js）。
 *
 * @interface
 * addAlert(alert: Object) => Promise<{ id: string, ...alert }>
 * getRecentAlertsByUser(userEmail: string, limit: number) => Promise<Alert[]>
 * acknowledgeAlert(alertId: string, payload: Object) => Promise<void>
 */

function notImplemented() {
  throw new Error('RiskAlert repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  addAlert: () => notImplemented(),
  getRecentAlertsByUser: () => notImplemented(),
  acknowledgeAlert: () => notImplemented()
};
