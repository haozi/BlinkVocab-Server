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
  .regex(
    /^[a-zA-Z0-9-]+$/,
    'Word must contain only letters, numbers, and hyphens',
  )
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

/**
 * GET /api/words query parameters
 */
export const getWordsQuerySchema = z.object({
  status: z.string().optional(), // Comma-separated: 'new,learning,review'
  dictionaryId: z.string().cuid().optional(),
  tagId: z.string().cuid().optional(),
  sort: z
    .enum(['next_due', 'recent', 'added', 'wrong_most'])
    .optional()
    .default('next_due'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
})

export type GetWordsQuery = z.infer<typeof getWordsQuerySchema>

/**
 * GET /api/words response item
 */
export const wordItemSchema = z.object({
  wordId: z.string(),
  lemma: z.string(),
  status: z.enum(['new', 'learning', 'review', 'mastered', 'ignored']),
  stage: z.number().int().nonnegative(),
  nextDueAt: z.date().nullable(),
  lastEventAt: z.date().nullable(),
  dictionaries: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
  tags: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['dictionary', 'topic', 'level']),
    }),
  ),
})

export type WordItem = z.infer<typeof wordItemSchema>

/**
 * GET /api/words response
 */
export const getWordsResponseSchema = z.object({
  items: z.array(wordItemSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export type GetWordsResponse = z.infer<typeof getWordsResponseSchema>

/**
 * GET /api/words/:wordId response
 */
export const wordDetailResponseSchema = z.object({
  word: z.object({
    wordId: z.string(),
    lemma: z.string(),
    senses: z.array(
      z.object({
        id: z.string(),
        pos: z.string().nullable(),
        definition: z.string(),
        examples: z.any().nullable(), // JSON array
        order: z.number().int().nonnegative(),
      }),
    ),
    tags: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['dictionary', 'topic', 'level']),
      }),
    ),
    dictionaries: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
      }),
    ),
  }),
  user: z
    .object({
      userWordId: z.string(),
      status: z.enum(['new', 'learning', 'review', 'mastered', 'ignored']),
      stage: z.number().int().nonnegative(),
      nextDueAt: z.date().nullable(),
    })
    .nullable(),
  events: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      createdAt: z.date(),
      payload: z.any().nullable(), // JSON
    }),
  ),
})

export type WordDetailResponse = z.infer<typeof wordDetailResponseSchema>
