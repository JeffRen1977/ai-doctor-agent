import { tool } from 'ai';
import { z } from 'zod';

export function createQueryVitalsTool(vitalsDailyRepo) {
  return tool({
    description: '查询用户指定日期的体征数据（血糖、血压、心率等）。返回单日聚合数据。',
    inputSchema: z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD')
        .describe('要查询的日期，格式 YYYY-MM-DD'),
    }),
    contextSchema: z.object({
      userId: z.string(),
    }),
    execute: async ({ date }, { context }) => {
      const vitals = await vitalsDailyRepo.getVitalsDaily(context.userId, date);
      if (!vitals) return { date, data: null, message: '该日期无体征数据' };
      return { date, data: vitals };
    },
  });
}
