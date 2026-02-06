/**
 * DEPRECATED: This file is kept for compatibility only.
 *
 * Next.js 16 deprecated the middleware.ts convention.
 * For authentication utilities, use: @see src/lib/auth.ts
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Pass-through middleware (deprecated)
 * Does not modify requests - all logic moved to route handlers
 */
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [], // Disabled - no routes use this middleware
}
