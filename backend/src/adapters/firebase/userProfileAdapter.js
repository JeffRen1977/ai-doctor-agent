/**
 * Firebase Adapter: UserProfile
 * 读写 userProfile/{email}，文档 ID = email。
 */

const { doc, getDoc, setDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'userProfile';

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

async function deleteByEmail(email) {
  if (!email) return { deletedCount: 0 };
  await deleteDoc(doc(db, COLLECTION, email));
  return { deletedCount: 1 };
}

module.exports = {
  getByEmail,
  setByEmail,
  updateByEmail,
  deleteByEmail
};
