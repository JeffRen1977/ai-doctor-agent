/**
 * 请求级上下文 —— 用 AsyncLocalStorage 把 requestId / 用户身份透传到调用栈任意深处。
 *
 * 目的：任何一行日志、任何一条审计记录，都能自动带上是哪个请求产生的，
 * 而不需要把 req 一路当参数传进 service 层。排查「这条告警当时为什么没发出来」时，
 * 靠 requestId 就能把 HTTP 请求、LLM 调用、数据库写入串成一条完整链路。
 */

const { AsyncLocalStorage } = require('node:async_hooks');
const crypto = require('node:crypto');

const storage = new AsyncLocalStorage();

/** @returns {string} 32 位十六进制请求 ID */
function newRequestId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 在给定上下文中执行 fn；fn 内部（含其 await 链）都能读到该上下文。
 * @param {{requestId: string, userId?: string, userEmail?: string, route?: string}} context
 * @param {Function} fn
 */
function runWithContext(context, fn) {
  return storage.run({ ...context }, fn);
}

/** @returns {object} 当前上下文，不在请求内时返回空对象 */
function getContext() {
  return storage.getStore() || {};
}

/** 在请求生命周期中途补充字段（如认证之后才知道 userId） */
function setContextValue(key, value) {
  const store = storage.getStore();
  if (store) store[key] = value;
}

module.exports = { newRequestId, runWithContext, getContext, setContextValue };
