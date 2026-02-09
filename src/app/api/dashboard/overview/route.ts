import { extractUserId, unauthorizedResponse } from '@/lib/auth'
import { getDashboardOverviewForUser } from '@/lib/dashboard-overview'
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
    const userId = extractUserId(request)
    if (!userId) {
      return unauthorizedResponse()
    }

    const overview = await getDashboardOverviewForUser(userId)
    if (!overview) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(overview, { status: 200 })
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
