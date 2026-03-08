/**
 * Repository 接口契约：NutritionAnalysis（营养分析记录）
 * 实际实现由 Adapter 提供（见 adapters/firebase/nutritionAnalysisAdapter.js）。
 *
 * @interface
 * addNutritionAnalysis(data: Object) => Promise<{ id: string, ...data }>
 */

function notImplemented() {
  throw new Error('NutritionAnalysis repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  addNutritionAnalysis: () => notImplemented()
};
