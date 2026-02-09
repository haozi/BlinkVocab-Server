import { prisma } from '@/lib/prisma'
import {
  dashboardOverviewResponseSchema,
  type DashboardOverviewResponse,
} from '@/types/dashboard'

export async function getDashboardOverviewForUser(
  userId: string,
): Promise<DashboardOverviewResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    return null
  }

  const now = new Date()
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [statusCounts, userWords, eventCounts] = await Promise.all([
    prisma.userWord.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    }),
    prisma.userWord.findMany({
      where: { userId },
      select: { nextDueAt: true, status: true },
    }),
    prisma.userWordEvent.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    }),
  ])

  const totals = {
    total: 0,
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
  }

  for (const row of statusCounts) {
    const count = row._count.id
    totals.total += count
    if (row.status === 'new') totals.new = count
    else if (row.status === 'learning') totals.learning = count
    else if (row.status === 'review') totals.review = count
    else if (row.status === 'mastered') totals.mastered = count
  }

  let dueToday = 0
  let overdue = 0

  for (const userWord of userWords) {
    if (!userWord.nextDueAt) {
      continue
    }

    if (userWord.status === 'mastered' || userWord.status === 'ignored') {
      continue
    }

    const dueTime = userWord.nextDueAt.getTime()
    const todayEndTime = todayEnd.getTime()
    const nowTime = now.getTime()

    if (dueTime <= nowTime) {
      overdue++
    } else if (dueTime <= todayEndTime) {
      dueToday++
    }
  }

  const activityMap = new Map<string, number>()
  for (const event of eventCounts) {
    const dateStr = event.createdAt.toISOString().split('T')[0]
    const count = event._count.id
    const existing = activityMap.get(dateStr) || 0
    activityMap.set(dateStr, existing + count)
  }

  const last7Days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    const events = activityMap.get(dateStr) || 0

    last7Days.unshift({
      date: new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      ).toISOString(),
      events,
    })
  }

  const response: DashboardOverviewResponse = {
    totals,
    due: { dueToday, overdue },
    activity: { last7Days },
  }

  return dashboardOverviewResponseSchema.parse(response)
}

