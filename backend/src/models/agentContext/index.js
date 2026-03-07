/**
 * 领域模型统一导出（AI 代理数据架构）
 * 与存储无关，供 Repository、Context Builder 使用。
 * 详见 docs/data-format/AI_AGENT_DATA_ARCHITECTURE.md
 */

const userBasicInfo = require('../userBasicInfo');
const medication = require('../medication');
const vitalsDaily = require('../vitalsDaily');
const chatSession = require('../chatSession');
const aiContextPayload = require('../aiContextPayload');

module.exports = {
  // UserBasicInfo
  userBasicInfoSchema: userBasicInfo.userBasicInfoSchema,
  validateUserBasicInfo: userBasicInfo.validateUserBasicInfo,

  // Medication
  medicationSchema: medication.medicationSchema,
  validateMedication: medication.validateMedication,
  normalizeMedicationFromLegacy: medication.normalizeMedicationFromLegacy,

  // VitalsDaily
  vitalsDailySchema: vitalsDaily.vitalsDailySchema,
  validateVitalsDaily: vitalsDaily.validateVitalsDaily,

  // ChatSession
  chatSessionSchema: chatSession.chatSessionSchema,
  validateChatSession: chatSession.validateChatSession,

  // AIContextPayload
  aiContextPayloadSchema: aiContextPayload.aiContextPayloadSchema,
  validateAIContextPayload: aiContextPayload.validateAIContextPayload
};
