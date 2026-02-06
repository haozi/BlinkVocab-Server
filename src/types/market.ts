import { z } from 'zod'

/**
 * Market API Request/Response Schemas
 */

// POST /api/market/join
export const marketJoinRequestSchema = z.object({
  dictionaryIds: z.array(z.string().uuid('Invalid dictionary ID')).min(1, 'At least one dictionary ID required'),
})

export type MarketJoinRequest = z.infer<typeof marketJoinRequestSchema>

export const marketJoinResponseSchema = z.object({
  dictionaries: z.array(
    z.object({
      dictionaryId: z.string(),
      addedCount: z.number(),
      alreadyHadCount: z.number(),
    }),
  ),
})

export type MarketJoinResponse = z.infer<typeof marketJoinResponseSchema>
