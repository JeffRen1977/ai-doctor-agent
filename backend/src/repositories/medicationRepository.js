/**
 * Repository 接口契约：Medication
 * 实际实现由 Adapter 提供（见 adapters/firebase/medicationAdapter.js）。
 * 业务层应通过 repositories/index.js 门面获取实现。
 *
 * @interface
 * listActive(userId: string) => Promise<Medication[]>
 * add(userId: string, item: Medication) => Promise<Medication>
 * update(userId: string, medicationId: string, patch: Partial<Medication>) => Promise<void>
 * remove(userId: string, medicationId: string) => Promise<void>
 */

function notImplemented() {
  throw new Error('Medication repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  listActive: () => notImplemented(),
  add: () => notImplemented(),
  update: () => notImplemented(),
  remove: () => notImplemented()
};
