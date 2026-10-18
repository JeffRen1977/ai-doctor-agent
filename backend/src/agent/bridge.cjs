/**
 * CJS 桥接 — 让现有 require() 路由代码能调用 ESM Agent 模块。
 * dynamic import() 是 CJS 中调用 ESM 的标准方式。
 */

let _orchestrator = null;

async function getOrchestrator() {
  if (!_orchestrator) {
    _orchestrator = await import('./orchestrator.mjs');
  }
  return _orchestrator;
}

module.exports = { getOrchestrator };
