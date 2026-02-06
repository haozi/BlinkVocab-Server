import { prisma } from '@/lib/prisma'
import { extractUserId, unauthorizedResponse } from '@/lib/auth'
import { marketJoinRequestSchema, type MarketJoinResponse } from '@/types/market'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/market/join
 * 用户加入字典（批量订阅字典并创建学习记录）
 *
 * Header:
 *   x-user-id: UUID - 用户ID
 *
 * Body:
 *   dictionaryIds: string[] - 字典ID列表
 *
 * Returns:
 *   { dictionaries: [{ dictionaryId, addedCount, alreadyHadCount }] }
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
    const validatedData = marketJoinRequestSchema.parse(body)
    const { dictionaryIds } = validatedData

    // 3. Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Verify all dictionaries exist
      const dictionaries = await tx.dictionary.findMany({
        where: {
          id: {
            in: dictionaryIds,
          },
        },
        include: {
          words: {
            select: {
              wordId: true,
            },
          },
        },
      })

      if (dictionaries.length !== dictionaryIds.length) {
        throw new Error('One or more dictionaries not found')
      }

      // Upsert user_dictionaries
      await Promise.all(
        dictionaries.map((dict) =>
          tx.userDictionary.upsert({
            where: {
              userId_dictionaryId: {
                userId,
                dictionaryId: dict.id,
              },
            },
            update: {}, // No update needed
            create: {
              userId,
              dictionaryId: dict.id,
            },
          }),
        ),
      )

      // For each dictionary, get all its words and upsert user_words
      const eventData: Array<{
        userId: string
        wordId: string
        userWordId?: string | null
        type: string
        payload?: Record<string, any>
      }> = []

      const stats = await Promise.all(
        dictionaries.map(async (dict) => {
          const wordIds = dict.words.map((w) => w.wordId)

          if (wordIds.length === 0) {
            return {
              dictionaryId: dict.id,
              addedCount: 0,
              alreadyHadCount: 0,
            }
          }

          // Get existing user_words for these words
          const existingUserWords = await tx.userWord.findMany({
            where: {
              userId,
              wordId: {
                in: wordIds,
              },
            },
            select: {
              wordId: true,
              id: true,
            },
          })

          const existingWordIds = new Set(existingUserWords.map((uw) => uw.wordId))
          const newWordIds = wordIds.filter((wid) => !existingWordIds.has(wid))

          let addedCount = 0

          // Create new user_words
          if (newWordIds.length > 0) {
            // Batch create new user_words
            await tx.userWord.createMany({
              data: newWordIds.map((wordId) => ({
                userId,
                wordId,
                status: 'new',
                stage: 0,
                nextDueAt: new Date(),
              })),
            })

            addedCount = newWordIds.length

            // Fetch created user_words for event logging
            const createdUserWords = await tx.userWord.findMany({
              where: {
                userId,
                wordId: {
                  in: newWordIds,
                },
              },
              select: {
                id: true,
                wordId: true,
              },
            })

            // Add events for each new word
            createdUserWords.forEach((uw) => {
              eventData.push({
                userId,
                wordId: uw.wordId,
                userWordId: uw.id,
                type: 'added_by_dictionary',
                payload: {
                  dictionaryId: dict.id,
                },
              })
            })
          }

          // Add dictionary_added event
          eventData.push({
            userId,
            wordId: wordIds[0] || '', // Use first word as reference, or empty for event
            type: 'dictionary_added',
            payload: {
              dictionaryId: dict.id,
              totalWords: wordIds.length,
            },
          })

          return {
            dictionaryId: dict.id,
            addedCount,
            alreadyHadCount: existingWordIds.size,
          }
        }),
      )

      // Batch create events
      if (eventData.length > 0) {
        // Create a valid data array for Prisma
        const createManyData = eventData.map((e) => {
          const data: any = {
            userId: e.userId,
            wordId: e.wordId,
            type: e.type,
          }

          if (e.userWordId) {
            data.userWordId = e.userWordId
          }

          if (e.payload) {
            data.payload = e.payload
          }

          return data
        })

        await tx.userWordEvent.createMany({
          data: createManyData,
        })
      }

      return stats
    })

    // 4. Return response
    const response: MarketJoinResponse = {
      dictionaries: result,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Market join error:', error)

    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      // Handle parse/validation errors
      if (error.message.includes('Invalid')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
