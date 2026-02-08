import { extractUserId, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getNextDueDate,
  getNextStage,
  reviewSubmitRequestSchema,
  reviewSubmitResponseSchema,
  type ReviewSubmitResponse,
} from '@/types/review'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/review/submit
 * 提交单个单词的复习结果，使用 SRS 算法更新阶段和下次复习时间
 *
 * Header:
 *   x-user-id: UUID - 用户ID
 *
 * Body:
 *   userWordId: string - 用户单词ID (CUID)
 *   correct: boolean - 是否回答正确
 *
 * Returns:
 *   { userWordId, wordId, lemma, stage, status, nextDueAt, correct }
 *
 * SRS Logic:
 *   Correct:
 *     - stage += 1 (max at last interval)
 *     - nextDueAt = now + intervals[stage]
 *   Wrong:
 *     - stage = max(stage - 1, 0)
 *     - nextDueAt = now + 10 minutes
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate user ID
    const userId = extractUserId(request)
    if (!userId) {
      return unauthorizedResponse()
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validatedData = reviewSubmitRequestSchema.parse(body)
    const { userWordId, correct } = validatedData

    // 3. Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Get user_word with related word
      const userWord = await tx.userWord.findUnique({
        where: { id: userWordId },
        include: { word: true },
      })

      if (!userWord) {
        throw new Error('User word not found')
      }

      // Verify ownership
      if (userWord.userId !== userId) {
        throw new Error('Unauthorized: user word does not belong to this user')
      }

      // Calculate new stage and due date
      const now = new Date()
      const newStage = getNextStage(userWord.stage, correct)
      const nextDueAt = getNextDueDate(now, userWord.stage, correct)

      // Determine new status based on stage
      let newStatus = userWord.status
      if (userWord.status === 'new' && correct) {
        newStatus = 'learning'
      } else if (newStage >= 2 && correct) {
        newStatus = 'review'
      }

      // Update user_word
      const updatedUserWord = await tx.userWord.update({
        where: { id: userWordId },
        data: {
          stage: newStage,
          nextDueAt,
          status: newStatus,
        },
      })

      // Create event record
      await tx.userWordEvent.create({
        data: {
          userId,
          wordId: userWord.wordId,
          userWordId,
          type: correct ? 'answer_correct' : 'answer_wrong',
          payload: {
            oldStage: userWord.stage,
            newStage,
            correct,
          },
        },
      })

      return {
        userWordId: updatedUserWord.id,
        wordId: updatedUserWord.wordId,
        lemma: userWord.word.lemma,
        stage: updatedUserWord.stage,
        status: updatedUserWord.status,
        nextDueAt: updatedUserWord.nextDueAt || new Date(),
        correct,
      }
    })

    const response: ReviewSubmitResponse = result

    // Validate response
    reviewSubmitResponseSchema.parse(response)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      const statusCode =
        error.message === 'User not found'
          ? 404
          : error.message === 'User word not found'
            ? 404
            : error.message.startsWith('Unauthorized')
              ? 403
              : 400

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: statusCode },
      )
    }

    console.error('Unexpected error in POST /api/review/submit:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    )
  }
}
