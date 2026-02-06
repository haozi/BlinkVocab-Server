import { z } from 'zod'

export const dashboardOverviewResponseSchema = z.object({
  totals: z.object({
    total: z.number().int().nonnegative(),
    new: z.number().int().nonnegative(),
    learning: z.number().int().nonnegative(),
    review: z.number().int().nonnegative(),
    mastered: z.number().int().nonnegative(),
  }),
  due: z.object({
    dueToday: z.number().int().nonnegative(),
    overdue: z.number().int().nonnegative(),
  }),
  activity: z.object({
    last7Days: z.array(
      z.object({
        date: z.string().datetime({ offset: true }),
        events: z.number().int().nonnegative(),
      }),
    ),
  }),
})

export type DashboardOverviewResponse = z.infer<
  typeof dashboardOverviewResponseSchema
>
