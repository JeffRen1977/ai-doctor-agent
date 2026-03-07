/**
 * Repository 接口契约：UserBasicInfo
 * 实际实现由 Adapter 提供（见 adapters/firebase/userBasicInfoAdapter.js）。
 * 业务层应通过 repositories/index.js 门面获取实现，不要直接 require 本文件。
 *
 * @interface
 * getBasicInfo(userId: string) => Promise<UserBasicInfo | null>
 * saveBasicInfo(userId: string, data: Partial<UserBasicInfo>) => Promise<void>
 * getBasicInfoForAgent(userId: string) => Promise<string>   // 固定格式摘要，供 System Prompt；不含 medications
 * getFullHealthRecord(userId: string) => Promise<Object | null>  // 根文档全文 + medications 子集合（数组），供报表/数字孪生等
 */

function notImplemented() {
  throw new Error('UserBasicInfo repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getBasicInfo: () => notImplemented(),
  saveBasicInfo: () => notImplemented(),
  getBasicInfoForAgent: () => notImplemented(),
  getFullHealthRecord: () => notImplemented()
};
