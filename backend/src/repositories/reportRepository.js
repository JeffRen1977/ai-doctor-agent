/**
 * Repository 接口契约：Report（报告）
 * 实际实现由 Adapter 提供（见 adapters/firebase/reportAdapter.js）。
 *
 * @interface
 * saveReport(report: Object) => Promise<void>
 * getReport(reportId: string) => Promise<Report | null>
 * listReportsByUser(userEmail: string, options?: { limit?, reportType? }) => Promise<Report[]>
 */

function notImplemented() {
  throw new Error('Report repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  saveReport: () => notImplemented(),
  getReport: () => notImplemented(),
  listReportsByUser: () => notImplemented()
};
