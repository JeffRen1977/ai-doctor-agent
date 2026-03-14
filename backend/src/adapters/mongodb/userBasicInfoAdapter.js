/**
 * MongoDB Adapter: UserBasicInfo（与 firebase/userBasicInfoAdapter 同接口）
 * 读写 personalHealthRecords 根文档中的基础信息字段。
 */
const { getCollection } = require('./connection');
const { validateUserBasicInfo } = require('../../models/userBasicInfo');
const medicationAdapter = require('./medicationAdapter');

const COLLECTION = 'personalHealthRecords';

function fromFirestoreDoc(docId, data) {
  if (!data) return null;
  const toDate = (v) => {
    if (v && typeof v.toDate === 'function') return v.toDate();
    if (v instanceof Date) return v;
    if (typeof v === 'string') return new Date(v);
    return v;
  };
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

async function getBasicInfo(userId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  if (!doc) return null;
  const docId = doc._id != null && typeof doc._id.toString === 'function' ? doc._id.toString() : String(doc._id || '');
  return fromFirestoreDoc(docId, doc);
}

async function getBasicInfoForAgent(userId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  if (!doc) return '暂无基础档案信息。';

  const data = doc;
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

async function saveBasicInfo(userId, data) {
  const col = getCollection(COLLECTION);
  const allowed = ['basicInfo', 'medicalHistory', 'familyHistory', 'allergies', 'emergencyContact', 'medicalDocuments'];
  const updates = { updatedAt: new Date() };
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }
  await col.updateOne({ _id: userId }, { $set: updates }, { upsert: true });
}

async function getFullHealthRecord(userId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  if (!doc) return null;
  const medications = await medicationAdapter.listActive(userId);
  return { ...doc, medications };
}

module.exports = {
  getBasicInfo,
  getBasicInfoForAgent,
  saveBasicInfo,
  getFullHealthRecord,
  fromFirestoreDoc
};
