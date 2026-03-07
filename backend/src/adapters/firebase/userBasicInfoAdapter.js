/**
 * Firebase Adapter: UserBasicInfo
 * 读写 personalHealthRecords/{userId} 根文档中的基础信息字段。
 * 仅依赖 config/firebase 与 models，不依赖 services 或 routes.
 */

const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');
const { validateUserBasicInfo } = require('../../models/userBasicInfo');
const medicationAdapter = require('./medicationAdapter');

const COLLECTION = 'personalHealthRecords';

/**
 * 将 Firestore 文档转为 UserBasicInfo 形态（含 Timestamp -> Date）
 */
function fromFirestoreDoc(docId, data) {
  if (!data) return null;
  const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v);
  const out = {
    userId: docId,
    userEmail: data.userEmail || 'noreply@local',
    basicInfo: data.basicInfo || undefined,
    medicalHistory: data.medicalHistory != null ? String(data.medicalHistory) : null,
    familyHistory: data.familyHistory != null ? String(data.familyHistory) : null,
    allergies: data.allergies != null ? String(data.allergies) : null,
    emergencyContact: data.emergencyContact || undefined,
    medicalDocuments: data.medicalDocuments,
    updatedAt: toDate(data.updatedAt),
    createdAt: toDate(data.createdAt)
  };
  const result = validateUserBasicInfo(out);
  if (result.error) return null;
  return result.value;
}

/**
 * @param {string} userId - 文档 ID（一般为 sanitized email）
 * @returns {Promise<import('../../models/userBasicInfo').UserBasicInfo | null>}
 */
async function getBasicInfo(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromFirestoreDoc(snap.id, snap.data());
}

/**
 * 返回固定格式摘要字符串，供 AI System Prompt 使用。不含 medications。
 * @param {string} userId
 * @returns {Promise<string>}
 */
async function getBasicInfoForAgent(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return '暂无基础档案信息。';

  const data = snap.data();
  const basicInfo = data.basicInfo || {};
  const medicalHistory = data.medicalHistory != null ? String(data.medicalHistory) : '';
  const familyHistory = data.familyHistory != null ? String(data.familyHistory) : '';
  const allergies = data.allergies != null ? String(data.allergies) : '';
  const emergencyContact = data.emergencyContact;

  const parts = [];
  if (basicInfo.name || basicInfo.gender || basicInfo.age || basicInfo.bloodType) {
    const bi = [
      basicInfo.name && `姓名：${basicInfo.name}`,
      basicInfo.gender && `性别：${basicInfo.gender}`,
      basicInfo.age != null && `年龄：${basicInfo.age}`,
      basicInfo.bloodType && `血型：${basicInfo.bloodType}`,
      basicInfo.height != null && `身高：${basicInfo.height}cm`,
      basicInfo.weight != null && `体重：${basicInfo.weight}kg`
    ].filter(Boolean);
    if (bi.length) parts.push('【基础信息】' + bi.join('，'));
  }
  if (medicalHistory) parts.push('【既往病史】' + medicalHistory);
  if (familyHistory) parts.push('【家族史】' + familyHistory);
  if (allergies) parts.push('【过敏史】' + allergies);
  if (emergencyContact && (emergencyContact.name || emergencyContact.phone)) {
    parts.push('【紧急联系人】' + [emergencyContact.name, emergencyContact.phone].filter(Boolean).join(' '));
  }
  return parts.length ? parts.join('\n') : '暂无基础档案信息。';
}

/**
 * 更新根文档中的基础信息字段（merge，不覆盖其他字段如 medications）
 * 文档不存在时会创建。
 * @param {string} userId
 * @param {Object} data - 部分字段，如 basicInfo, medicalHistory, familyHistory, allergies, emergencyContact
 */
async function saveBasicInfo(userId, data) {
  const ref = doc(db, COLLECTION, userId);
  const allowed = ['basicInfo', 'medicalHistory', 'familyHistory', 'allergies', 'emergencyContact', 'medicalDocuments'];
  const updates = { updatedAt: new Date() };
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }
  await setDoc(ref, updates, { merge: true });
}

/**
 * 返回根文档全文 + medications 子集合（数组），供报表、数字孪生等需要完整档案的场景。
 * 业务层仅依赖 Repository，换库时只需改 Adapter。
 * @param {string} userId
 * @returns {Promise<Object | null>} 根文档 data() 且 medications 为 listActive 结果
 */
async function getFullHealthRecord(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const medications = await medicationAdapter.listActive(userId);
  return { ...data, medications };
}

module.exports = {
  getBasicInfo,
  getBasicInfoForAgent,
  saveBasicInfo,
  getFullHealthRecord,
  fromFirestoreDoc
};
