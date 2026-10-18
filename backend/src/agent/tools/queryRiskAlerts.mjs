import { tool } from 'ai';
import { z } from 'zod';

export function createQueryRiskAlertsTool(riskAlertRepo) {
  return tool({
    description: '查询用户最近的风险预警记录，包括预警类型、严重程度和时间。',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(50).default(10)
        .describe('返回最近多少条预警'),
    }),
    contextSchema: z.object({
      userEmail: z.string(),
    }),
    execute: async ({ limit }, { context }) => {
      const alerts = await riskAlertRepo.getRecentAlertsByUser(context.userEmail, limit);
      if (!alerts || alerts.length === 0) {
        return { alerts: [], message: '近期无风险预警' };
      }
      return { alerts };
    },
  });
}
