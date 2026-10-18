/**
 * CJS 桥接 — 让现有 require() 路由代码能调用 ESM Agent 模块。
 * dynamic import() 是 CJS 中调用 ESM 的标准方式。
 */

let _modules = null;

async function loadAgentModules() {
  if (!_modules) {
    const [orchestrator, init, safety] = await Promise.all([
      import('./orchestrator.mjs'),
      import('./init.mjs'),
      import('./safety.mjs'),
    ]);
    _modules = { orchestrator, init, safety };
  }
  return _modules;
}

async function getOrchestrator() {
  const { orchestrator } = await loadAgentModules();
  return orchestrator;
}

async function initAgent(repos) {
  const { init } = await loadAgentModules();
  return init.initAgent(repos);
}

async function getAgentInstance() {
  const { init } = await loadAgentModules();
  return init.getAgentInstance();
}

async function getAgentSafety() {
  const { safety } = await loadAgentModules();
  return safety;
}

module.exports = { getOrchestrator, initAgent, getAgentInstance, getAgentSafety };
