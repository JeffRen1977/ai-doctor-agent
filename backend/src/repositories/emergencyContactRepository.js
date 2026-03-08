/**
 * Repository 接口契约：EmergencyContact（紧急联系人）
 * 实际实现由 Adapter 提供。
 *
 * @interface
 * saveContact(contact) => Promise<void>
 * getContact(contactId) => Promise<Object | null>
 * listByUser(userEmail) => Promise<Object[]>
 * updateContact(contactId, updates) => Promise<void>
 * deleteContact(contactId) => Promise<void>
 * unsetPrimaryForUser(userEmail) => Promise<void>
 */

function notImplemented() {
  throw new Error('EmergencyContact repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  saveContact: () => notImplemented(),
  getContact: () => notImplemented(),
  listByUser: () => notImplemented(),
  updateContact: () => notImplemented(),
  deleteContact: () => notImplemented(),
  unsetPrimaryForUser: () => notImplemented()
};
