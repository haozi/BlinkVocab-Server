import { prisma } from '@/lib/prisma'
import { extractUserId, unauthorizedResponse } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

/**
 * GET /api/tasks/today
 * 获取今天的学习任务（到期的和新的单词）
 *
 * Header:
 *   x-user-id: UUID - 用户ID
 *
 * Returns:
 *   {
 *     due: [{ userWordId, wordId, lemma, stage, status, nextDueAt }],
 *     new: [{ userWordId, wordId, lemma, stage, status, nextDueAt }]
 *   }
 *
 * Logic:
 *   due: nextDueAt <= now && status != 'mastered' && status != 'ignored'
 *   new: status = 'new'
 */

const tasksResponseSchema = z.object({
  due: z.array(
    z.object({
      userWordId: z.string(),
      wordId: z.string(),
      lemma: z.string(),
      stage: z.number().int().nonnegative(),
      status: z.enum(['new', 'learning', 'review', 'mastered', 'ignored']),
      nextDueAt: z.date(),
    }),
  ),
  new: z.array(
    z.object({
      userWordId: z.string(),
      wordId: z.string(),
      lemma: z.string(),
      stage: z.number().int().nonnegative(),
      status: z.enum(['new', 'learning', 'review', 'mastered', 'ignored']),
      nextDueAt: z.date(),
    }),
  ),
})

type TasksResponse = z.infer<typeof tasksResponseSchema>

export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate user ID
    const userId = extractUserId(request)
    if (!userId) {
      return unauthorizedResponse()
    }

    // 2. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Get due and new tasks
    const now = new Date()

    const [dueWords, newWords] = await Promise.all([
      // Due words: nextDueAt <= now, excluding mastered/ignored
      prisma.userWord.findMany({
        where: {
          userId,
          nextDueAt: { lte: now },
          status: { notIn: ['mastered', 'ignored'] },
        },
        include: { word: true },
        orderBy: { nextDueAt: 'asc' },
      }),

      // New words: status = 'new'
      prisma.userWord.findMany({
        where: {
          userId,
          status: 'new',
        },
        include: { word: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // 4. Format response
    const dueFormatted = dueWords.map((uw) => ({
      userWordId: uw.id,
      wordId: uw.wordId,
      lemma: uw.word.lemma,
      stage: uw.stage,
      status: uw.status,
      nextDueAt: uw.nextDueAt || new Date(),
    }))

    const newFormatted = newWords.map((uw) => ({
      userWordId: uw.id,
      wordId: uw.wordId,
      lemma: uw.word.lemma,
      stage: uw.stage,
      status: uw.status,
      nextDueAt: uw.nextDueAt || new Date(),
    }))

    const response: TasksResponse = {
      due: dueFormatted,
      new: newFormatted,
    }

    // Validate response
    tasksResponseSchema.parse(response)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in GET /api/tasks/today:', error.message)
    } else {
      console.error('Unexpected error in GET /api/tasks/today:', error)
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    )
  }
}
