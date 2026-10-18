import { tool } from 'ai';
import { z } from 'zod';

export function createQueryMedicationsTool(medicationRepo) {
  return tool({
    description: '查询用户当前正在使用的药物列表，包括药名、剂量、频次等信息。',
    inputSchema: z.object({}),
    contextSchema: z.object({
      userId: z.string(),
    }),
    execute: async (_args, { context }) => {
      const meds = await medicationRepo.listActive(context.userId);
      if (!meds || meds.length === 0) {
        return { medications: [], message: '当前无用药记录' };
      }
      return { medications: meds };
    },
  });
}
