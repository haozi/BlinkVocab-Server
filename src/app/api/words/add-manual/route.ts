import { prisma } from '@/lib/prisma'
import { extractUserId, unauthorizedResponse } from '@/lib/auth'
import { addManualWordRequestSchema, type AddManualWordResponse } from '@/types/words'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/words/add-manual
 * 用户手动添加单词
 *
 * Header:
 *   x-user-id: UUID - 用户ID
 *
 * Body:
 *   text: string - 词汇（自动 trim + toLowerCase）
 *   url?: string - 来源网址
 *   context?: string - 使用上下文
 *
 * Returns:
 *   { wordId, lemma, isNewWord, isNewUserWord }
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
    const validatedData = addManualWordRequestSchema.parse(body)
    const { text, url, context } = validatedData

    // Text is already normalized (trimmed + lowercase) by schema
    const normalizedText = text.toLowerCase().trim()

    // 3. Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Upsert word (create with source='custom' if new)
      const word = await tx.word.upsert({
        where: {
          lemma_language: {
            lemma: normalizedText,
            language: 'en',
          },
        },
        update: {}, // Don't update existing words
        create: {
          lemma: normalizedText,
          language: 'en',
          source: 'custom' as const,
        },
      })

      const isNewWord = word.source === 'custom'

      // Upsert user_word
      const userWord = await tx.userWord.upsert({
        where: {
          userId_wordId: {
            userId,
            wordId: word.id,
          },
        },
        update: {}, // Don't update existing user_words
        create: {
          userId,
          wordId: word.id,
          status: 'new' as const,
          stage: 0,
          nextDueAt: new Date(),
        },
      })

      const isNewUserWord =
        !userWord.createdAt || userWord.createdAt.getTime() === new Date().getTime()

      // Create event (always, even if word/user_word already exists)
      // Build payload conditionally
      const eventPayload: Record<string, string | undefined> = {
        lemma: normalizedText,
        url: url,
        context: context,
      }

      // Filter out undefined values
      const cleanPayload = Object.fromEntries(
        Object.entries(eventPayload).filter(([_, v]) => v !== undefined),
      )

      await tx.userWordEvent.create({
        data: {
          userId,
          wordId: word.id,
          userWordId: userWord.id,
          type: 'added_manual',
          payload: cleanPayload,
        },
      })

      return {
        wordId: word.id,
        lemma: word.lemma,
        isNewWord,
        isNewUserWord,
      }
    })

    const response: AddManualWordResponse = result

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 },
      )
    }

    // Handle other errors
    if (error instanceof Error) {
      const statusCode = error.message === 'User not found' ? 404 : 400

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: statusCode },
      )
    }

    console.error('Unexpected error in POST /api/words/add-manual:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    )
  }
}

// Import z for error handling
import { z } from 'zod'
