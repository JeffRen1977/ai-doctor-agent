/**
 * Repository 接口契约：ExercisePlan（运动计划）
 * 实际实现由 Adapter 提供（见 adapters/firebase/exercisePlanAdapter.js）。
 * 业务层应通过 repositories/index.js 门面获取实现。
 *
 * @interface
 * getExercisePlan(userId: string) => Promise<Object | null>   // 返回内层 plan 或 null
 * setExercisePlan(userId: string, data: Object) => Promise<void>  // data 含 plan，可选 userEmail
 */

function notImplemented() {
  throw new Error('ExercisePlan repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getExercisePlan: () => notImplemented(),
  setExercisePlan: () => notImplemented()
};
