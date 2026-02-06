import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Health check endpoint
 * GET /api/health
 * Returns: { ok: true, time: ISO timestamp }
 *
 * Optional Headers:
 * - x-user-id: User identifier for authenticated requests
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract user-id from header (optional)
    const userId = request.headers.get('x-user-id')

    const response = {
      ok: true,
      time: new Date().toISOString(),
      ...(userId && { userId }),
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
