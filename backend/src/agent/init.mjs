import { ToolRegistry } from './tools/registry.mjs';
import { MemoryManager } from './memoryManager.mjs';
import { createQueryVitalsTool } from './tools/queryVitals.mjs';
import { createQueryMedicationsTool } from './tools/queryMedications.mjs';
import { createQueryHealthRecordsTool } from './tools/queryHealthRecords.mjs';
import { createQueryRiskAlertsTool } from './tools/queryRiskAlerts.mjs';

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

  const memoryManager = new MemoryManager();

  _instance = { toolRegistry, memoryManager };
  return _instance;
}

export function getAgentInstance() {
  if (!_instance) {
    throw new Error('Agent not initialized. Call initAgent(repos) first.');
  }
  return _instance;
}
