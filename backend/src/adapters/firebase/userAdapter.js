/**
 * Firebase Adapter: User
 * 读写 users/{email}，文档 ID = email。
 */

const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'users';

/**
 * @param {string} email - 文档 ID
 * @returns {Promise<Object | null>}
 */
async function getByEmail(email) {
  if (!email) return null;
  const ref = doc(db, COLLECTION, email);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * @param {string} email
 * @param {Object} data
 */
async function setByEmail(email, data) {
  const ref = doc(db, COLLECTION, email);
  await setDoc(ref, data);
}

/**
 * @param {string} email
 * @param {Object} updates
 */
async function updateByEmail(email, updates) {
  const ref = doc(db, COLLECTION, email);
  await updateDoc(ref, updates);
}

/**
 * 按 uid 查询用户文档（users 集合中 uid 字段唯一）
 * @param {string} uid - Firebase Auth uid
 * @returns {Promise<Object | null>} 用户文档 data，不存在则 null
 */
async function getByUid(uid) {
  if (!uid) return null;
  const ref = collection(db, COLLECTION);
  const q = query(ref, where('uid', '==', uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

/**
 * 按重置令牌哈希查找用户。明文令牌只出现在邮件里，库里只有 SHA-256。
 * @param {string} hash
 * @returns {Promise<Object | null>}
 */
async function findByPasswordResetHash(hash) {
  if (!hash) return null;
  const ref = collection(db, COLLECTION);
  const q = query(ref, where('passwordResetTokenHash', '==', hash));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data() || {};
  return { email: data.email || snapshot.docs[0].id, ...data };
}

async function deleteByEmail(email) {
  if (!email) return { deletedCount: 0 };
  const ref = doc(db, COLLECTION, email);
  await deleteDoc(ref);
  return { deletedCount: 1 };
}

module.exports = {
  getByEmail,
  setByEmail,
  updateByEmail,
  getByUid,
  findByPasswordResetHash,
  deleteByEmail
};
