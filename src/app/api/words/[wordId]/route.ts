import { extractUserId, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  wordDetailResponseSchema,
  type WordDetailResponse,
} from '@/types/words'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/words/:wordId
 * 获取单个单词的详细信息
 *
 * Header:
 *   x-user-id: UUID - 用户ID
 *
 * Params:
 *   wordId: string - 单词ID
 *
 * Query:
 *   limit?: number - 返回的事件数量（默认50）
 *
 * Returns:
 *   {
 *     word: { wordId, lemma, senses[], tags[], dictionaries[] },
 *     user: { userWordId, status, stage, nextDueAt } | null,
 *     events: [{ id, type, createdAt, payload }]
 *   }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wordId: string }> },
) {
  try {
    // 1. Extract and validate user ID
    const userId = extractUserId(request)
    if (!userId) {
      return unauthorizedResponse()
    }

    // 2. Get wordId from params
    const { wordId } = await params

    // 3. Parse query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // 4. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 5. Get word with all related data
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        senses: {
          orderBy: { order: 'asc' },
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, type: true },
            },
          },
        },
        dictionaryWords: {
          include: {
            dictionary: {
              select: { id: true, name: true, description: true },
            },
          },
        },
      },
    })

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 })
    }

    // 6. Get user word data (if exists)
    const userWord = await prisma.userWord.findFirst({
      where: {
        userId,
        wordId,
      },
    })

    // 7. Get events for this word
    const events = await prisma.userWordEvent.findMany({
      where: {
        userId,
        wordId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        type: true,
        createdAt: true,
        payload: true,
      },
    })

    // 8. Format response
    const response: WordDetailResponse = {
      word: {
        wordId: word.id,
        lemma: word.lemma,
        senses: word.senses.map((sense) => ({
          id: sense.id,
          pos: sense.pos,
          definition: sense.definition,
          examples: sense.examples,
          order: sense.order,
        })),
        tags: word.tags.map((wt) => ({
          id: wt.tag.id,
          name: wt.tag.name,
          type: wt.tag.type,
        })),
        dictionaries: word.dictionaryWords.map((dw) => ({
          id: dw.dictionary.id,
          name: dw.dictionary.name,
          description: dw.dictionary.description,
        })),
      },
      user: userWord
        ? {
            userWordId: userWord.id,
            status: userWord.status,
            stage: userWord.stage,
            nextDueAt: userWord.nextDueAt,
          }
        : null,
      events: events.map((event) => ({
        id: event.id,
        type: event.type,
        createdAt: event.createdAt,
        payload: event.payload,
      })),
    }

    // Validate response
    wordDetailResponseSchema.parse(response)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in GET /api/words/:wordId:', error.message)
    } else {
      console.error('Unexpected error in GET /api/words/:wordId:', error)
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    )
  }
}
