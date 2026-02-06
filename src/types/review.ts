import { z } from 'zod'

/**
 * SRS (Spaced Repetition System) Configuration
 * Intervals in minutes
 */
export const SRS_INTERVALS_MINUTES = [10, 1440, 4320, 10080, 21600]
export const MAX_STAGE = SRS_INTERVALS_MINUTES.length - 1

export const reviewSubmitRequestSchema = z.object({
  userWordId: z.string().cuid('Invalid user word ID'),
  correct: z.boolean(),
})

export type ReviewSubmitRequest = z.infer<typeof reviewSubmitRequestSchema>

export const reviewSubmitResponseSchema = z.object({
  userWordId: z.string(),
  wordId: z.string(),
  lemma: z.string(),
  stage: z.number().int().nonnegative(),
  status: z.enum(['new', 'learning', 'review', 'mastered', 'ignored']),
  nextDueAt: z.date(),
  correct: z.boolean(),
})

export type ReviewSubmitResponse = z.infer<typeof reviewSubmitResponseSchema>

/**
 * Get next due date based on correct/wrong and current stage
 */
export function getNextDueDate(now: Date, stage: number, correct: boolean): Date {
  if (correct) {
    // Correct: use interval for current stage (before increment)
    const minutesToAdd = SRS_INTERVALS_MINUTES[Math.min(stage, MAX_STAGE)]
    return new Date(now.getTime() + minutesToAdd * 60 * 1000)
  } else {
    // Wrong: always 10 minutes from now
    return new Date(now.getTime() + 10 * 60 * 1000)
  }
}

/**
 * Get next stage based on correct/wrong and current stage
 */
export function getNextStage(stage: number, correct: boolean): number {
  if (correct) {
    return Math.min(stage + 1, MAX_STAGE)
  } else {
    return Math.max(stage - 1, 0)
  }
}
