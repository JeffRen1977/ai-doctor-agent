/**
 * Firebase Adapter: User
 * 读写 users/{email}，文档 ID = email。
 */

const { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } = require('firebase/firestore');
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

module.exports = {
  getByEmail,
  setByEmail,
  updateByEmail,
  getByUid
};
