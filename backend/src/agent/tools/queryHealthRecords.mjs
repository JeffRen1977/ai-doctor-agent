import { tool } from 'ai';
import { z } from 'zod';

export function createQueryHealthRecordsTool(userBasicInfoRepo) {
  return tool({
    description: '查询用户的基本健康档案，包括基础信息、病史、过敏史等。',
    inputSchema: z.object({
      detail: z.enum(['basic', 'full']).default('basic')
        .describe('basic: 摘要信息; full: 完整档案含用药子集合'),
    }),
    contextSchema: z.object({
      userId: z.string(),
    }),
    execute: async ({ detail }, { context }) => {
      if (detail === 'full') {
        const record = await userBasicInfoRepo.getFullHealthRecord(context.userId);
        if (!record) return { record: null, message: '无完整健康档案' };
        return { record };
      }
      const info = await userBasicInfoRepo.getBasicInfo(context.userId);
      if (!info) return { record: null, message: '无基本健康信息' };
      return { record: info };
    },
  });
}
