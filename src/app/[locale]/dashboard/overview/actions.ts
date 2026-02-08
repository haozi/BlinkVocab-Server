'use server'

import { DashboardOverviewResponse } from '@/types/dashboard'

const DEV_USER_ID = 'dev-user-123'

export async function getDashboardOverview(): Promise<DashboardOverviewResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/dashboard/overview`, {
      headers: {
        'x-user-id': DEV_USER_ID,
      },
      cache: 'no-store', // Always fetch fresh data
    })

    if (!response.ok) {
      console.error('Failed to fetch dashboard overview:', response.status)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching dashboard overview:', error)
    return null
  }
}
