/**
 * Authentication utilities for API routes
 *
 * Next.js 16 deprecated the middleware.ts convention.
 * Instead, handle authentication directly in route handlers using these utilities.
 *
 * Example usage:
 *
 * ```typescript
 * import { NextRequest } from 'next/server'
 * import { extractUserId, requireAuth } from '@/lib/auth'
 *
 * export async function GET(request: NextRequest) {
 *   const userId = extractUserId(request)
 *
 *   // Or require authentication
 *   const authenticatedUserId = requireAuth(request)
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Extract user ID from x-user-id header
 * Returns undefined if header not present
 */
export function extractUserId(request: NextRequest): string | undefined {
  return request.headers.get('x-user-id') ?? undefined
}

/**
 * Require authentication and throw error if missing
 * Use this in routes that require authenticated users
 */
export function requireAuth(request: NextRequest): string {
  const userId = extractUserId(request)
  if (!userId) {
    throw new Error('Unauthorized: Missing x-user-id header')
  }
  return userId
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Missing or invalid x-user-id header' },
    { status: 401 },
  )
}
