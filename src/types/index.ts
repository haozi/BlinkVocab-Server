/**
 * Type definitions for BlinkVocab Server API
 */

export interface HealthResponse {
  ok: boolean
  time: string
  userId?: string
}

export interface AuthRequest {
  userId: string
}

export interface ErrorResponse {
  ok: false
  error: string
  code?: string
  details?: Record<string, any>
}

export type ApiResponse<T> = T | ErrorResponse

export interface PaginationQuery {
  page?: number
  limit?: number
  offset?: number
}

export interface AuthenticatedRequest extends Record<string, any> {
  userId?: string
}
