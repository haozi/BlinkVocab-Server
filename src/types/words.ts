import { z } from 'zod'

/**
 * Validate word text:
 * - 2-30 characters
 * - Letters (a-z), numbers (0-9), and hyphens (-) only
 * - Trim whitespace automatically
 */
const wordTextSchema = z
  .string()
  .trim()
  .min(2, 'Word must be at least 2 characters')
  .max(30, 'Word must be at most 30 characters')
  .regex(/^[a-zA-Z0-9-]+$/, 'Word must contain only letters, numbers, and hyphens')
  .toLowerCase()

export const addManualWordRequestSchema = z.object({
  text: wordTextSchema,
  url: z.string().url().optional(),
  context: z.string().max(500).optional(),
})

export type AddManualWordRequest = z.infer<typeof addManualWordRequestSchema>

export const addManualWordResponseSchema = z.object({
  wordId: z.string(),
  lemma: z.string(),
  isNewWord: z.boolean(),
  isNewUserWord: z.boolean(),
})

export type AddManualWordResponse = z.infer<typeof addManualWordResponseSchema>
