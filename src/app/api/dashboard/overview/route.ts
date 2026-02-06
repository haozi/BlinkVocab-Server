import { prisma } from '@/lib/prisma'
import { extractUserId, unauthorizedResponse } from '@/lib/auth'
import { dashboardOverviewResponseSchema, type DashboardOverviewResponse } from '@/types/dashboard'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/dashboard/overview
 * 获取用户学习仪表板概览
 *
 * Header:
 *   x-user-id: UUID - 用户ID
 *
 * Returns:
 *   {
 *     totals: { total, new, learning, review, mastered },
 *     due: { dueToday, overdue },
 *     activity: { last7Days: [{ date, events }] }
 *   }
 *
 * All timestamps in UTC
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate user ID
    const userId = extractUserId(request)
    if (!userId) {
      return unauthorizedResponse()
    }

    // 2. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Execute aggregations in parallel for efficiency
    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [statusCounts, userWords, eventCounts] = await Promise.all([
      // Query 1: Count user_words by status
      prisma.userWord.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      }),

      // Query 2: Get all user_words with due dates for calculation
      prisma.userWord.findMany({
        where: { userId },
        select: { nextDueAt: true, status: true },
      }),

      // Query 3: Get event counts for last 7 days grouped by date
      prisma.userWordEvent.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        _count: { id: true },
      }),
    ])

    // 4. Process totals by status
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

    // 5. Process due counts
    let dueToday = 0
    let overdue = 0

    for (const uw of userWords) {
      // Skip if nextDueAt is null
      if (!uw.nextDueAt) {
        continue
      }

      // Only count if status is in active states (not mastered)
      if (uw.status === 'mastered' || uw.status === 'ignored') {
        continue
      }

      const dueTime = uw.nextDueAt.getTime()
      const todayEndTime = todayEnd.getTime()
      const nowTime = now.getTime()

      if (dueTime <= nowTime) {
        overdue++
      } else if (dueTime <= todayEndTime) {
        dueToday++
      }
    }

    // 6. Process activity - aggregate event counts by date
    const activityMap = new Map<string, number>()

    for (const event of eventCounts) {
      // Extract date in UTC (YYYY-MM-DD)
      const eventDate = new Date(event.createdAt)
      const dateStr = eventDate.toISOString().split('T')[0]
      const count = event._count.id

      const existing = activityMap.get(dateStr) || 0
      activityMap.set(dateStr, existing + count)
    }

    // Create array for last 7 days with data
    const last7Days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const events = activityMap.get(dateStr) || 0

      last7Days.unshift({
        date: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString(),
        events,
      })
    }

    // 7. Build response
    const response: DashboardOverviewResponse = {
      totals,
      due: {
        dueToday,
        overdue,
      },
      activity: {
        last7Days,
      },
    }

    // Validate response against schema
    const validated = dashboardOverviewResponseSchema.parse(response)

    return NextResponse.json(validated, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in GET /api/dashboard/overview:', error.message)
    } else {
      console.error('Unexpected error in GET /api/dashboard/overview:', error)
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    )
  }
}
