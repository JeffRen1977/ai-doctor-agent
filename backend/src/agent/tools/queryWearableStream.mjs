import { tool } from 'ai';
import { z } from 'zod';

export function createQueryWearableStreamTool(wearableStreamDataRepo) {
  return tool({
    description: '查询用户最近的可穿戴设备实时流数据（心率、血糖、血压、HRV等）。',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(100).default(20)
        .describe('返回最近多少条数据点'),
      timeRange: z.enum(['1h', '6h', '24h']).optional()
        .describe('可选的时间窗口过滤'),
    }),
    contextSchema: z.object({
      userEmail: z.string(),
    }),
    execute: async ({ limit, timeRange }, { context }) => {
      const options = { limit };
      if (timeRange) options.timeRange = timeRange;
      const data = await wearableStreamDataRepo.getRecentByUser(context.userEmail, options);
      if (!data || data.length === 0) {
        return { dataPoints: [], message: '近期无可穿戴设备数据' };
      }
      return { dataPoints: data, count: data.length };
    },
  });
}
