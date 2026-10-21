import { ToolRegistry } from './tools/registry.mjs';
import { MemoryManager } from './memoryManager.mjs';
import { SkillRegistry } from './skills/skillRegistry.mjs';
import { createQueryVitalsTool } from './tools/queryVitals.mjs';
import { createQueryMedicationsTool } from './tools/queryMedications.mjs';
import { createQueryHealthRecordsTool } from './tools/queryHealthRecords.mjs';
import { createQueryRiskAlertsTool } from './tools/queryRiskAlerts.mjs';
import { createQueryWearableStreamTool } from './tools/queryWearableStream.mjs';
import { healthChatSkill } from './skills/healthChat.mjs';
import { symptomAnalysisSkill } from './skills/symptomAnalysis.mjs';
import { drugInteractionSkill } from './skills/drugInteraction.mjs';
import { riskAssessmentSkill } from './skills/riskAssessment.mjs';
import { nutritionAnalysisSkill } from './skills/nutritionAnalysis.mjs';
import { exercisePlanningSkill } from './skills/exercisePlanning.mjs';
import { emotionalSupportSkill } from './skills/emotionalSupport.mjs';
import { metricsExplanationSkill } from './skills/metricsExplanation.mjs';

let _instance = null;

export function initAgent(repos) {
  const toolRegistry = new ToolRegistry();

  toolRegistry.register(
    'query_vitals',
    createQueryVitalsTool(repos.vitalsDailyRepo),
    'read',
  );
  toolRegistry.register(
    'query_medications',
    createQueryMedicationsTool(repos.medicationRepo),
    'read',
  );
  toolRegistry.register(
    'query_health_records',
    createQueryHealthRecordsTool(repos.userBasicInfoRepo),
    'read',
  );
  toolRegistry.register(
    'query_risk_alerts',
    createQueryRiskAlertsTool(repos.riskAlertRepo),
    'read',
  );
  toolRegistry.register(
    'query_wearable_stream',
    createQueryWearableStreamTool(repos.wearableStreamDataRepo),
    'read',
  );

  const skillRegistry = new SkillRegistry();
  skillRegistry.register({ ...healthChatSkill, isDefault: true });
  skillRegistry.register(symptomAnalysisSkill);
  skillRegistry.register(drugInteractionSkill);
  skillRegistry.register(riskAssessmentSkill);
  skillRegistry.register(nutritionAnalysisSkill);
  skillRegistry.register(exercisePlanningSkill);
  skillRegistry.register(emotionalSupportSkill);
  skillRegistry.register(metricsExplanationSkill);

  const memoryManager = new MemoryManager({
    chatSessionRepo: repos.chatSessionRepo,
    userBasicInfoRepo: repos.userBasicInfoRepo,
    agentMemoryRepo: repos.agentMemoryRepo,
    patientProfileRepo: repos.patientProfileRepo,
  });

  _instance = { toolRegistry, memoryManager, skillRegistry };
  return _instance;
}

export function getAgentInstance() {
  if (!_instance) {
    throw new Error('Agent not initialized. Call initAgent(repos) first.');
  }
  return _instance;
}
