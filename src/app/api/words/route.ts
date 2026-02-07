import { extractUserId, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getWordsQuerySchema,
  getWordsResponseSchema,
  type GetWordsResponse,
} from '@/types/words'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/words
 * 获取用户的单词列表，支持过滤、排序和分页
 *
 * Header:
 *   x-user-id: UUID - 用户ID
 *
 * Query:
 *   status?: string - 逗号分隔的状态列表 (e.g., 'new,learning,review')
 *   dictionaryId?: string - 字典ID过滤
 *   tagId?: string - 标签ID过滤
 *   sort?: 'next_due' | 'recent' | 'added' | 'wrong_most' - 排序方式
 *   page?: number - 页码 (默认 1)
 *   pageSize?: number - 每页数量 (默认 20, 最大 100)
 *
 * Returns:
 *   {
 *     items: [{ wordId, lemma, status, stage, nextDueAt, lastEventAt, dictionaries[], tags[] }],
 *     pagination: { page, pageSize, total, totalPages }
 *   }
 *
 * Sort options:
 *   - next_due: 最该复习的排前面 (nextDueAt ASC)
 *   - recent: 最近活动的排前面 (lastEventAt DESC)
 *   - added: 最近添加的排前面 (createdAt DESC)
 *   - wrong_most: 最近30天错误次数最多的排前面
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate user ID
    const userId = extractUserId(request)
    if (!userId) {
      return unauthorizedResponse()
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      status: searchParams.get('status') || undefined,
      dictionaryId: searchParams.get('dictionaryId') || undefined,
      tagId: searchParams.get('tagId') || undefined,
      sort: searchParams.get('sort') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    }

    const validatedQuery = getWordsQuerySchema.parse(queryParams)
    const { status, dictionaryId, tagId, sort, page, pageSize } = validatedQuery

    // 3. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Build where clause for filtering
    const whereClause: Prisma.UserWordWhereInput = {
      userId,
    }

    // Build word filter conditions
    const wordConditions: any = {}

    // Dictionary filter
    if (dictionaryId) {
      wordConditions.dictionaryWords = {
        some: {
          dictionaryId,
        },
      }
    }

    // Tag filter
    if (tagId) {
      wordConditions.tags = {
        some: {
          tagId,
        },
      }
    }

    // Apply word filter if any conditions exist
    if (Object.keys(wordConditions).length > 0) {
      whereClause.word = wordConditions
    }

    // Status filter (comma-separated)
    if (status) {
      const statusList = status.split(',').map((s) => s.trim())
      whereClause.status = { in: statusList as any }
    }

    // 5. Handle sorting
    let orderBy: Prisma.UserWordOrderByWithRelationInput[] = []
    let userWords: any[] = []

    if (sort === 'wrong_most') {
      // Special handling: count incorrect events in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Get all user words with their incorrect event counts
      const userWordsWithCounts = await prisma.$queryRaw<
        Array<{
          id: string
          userId: string
          wordId: string
          status: string
          stage: number
          nextDueAt: Date | null
          createdAt: Date
          word_id: string
          incorrect_count: bigint
        }>
      >`
        SELECT
          uw.*,
          COALESCE(COUNT(uwe.id) FILTER (WHERE uwe.type = 'incorrect' AND uwe."createdAt" >= ${thirtyDaysAgo}), 0) as incorrect_count
        FROM "UserWord" uw
        LEFT JOIN "UserWordEvent" uwe ON uw.id = uwe."userWordId"
        WHERE uw."userId" = ${userId}
        GROUP BY uw.id
        ORDER BY incorrect_count DESC, uw."nextDueAt" ASC NULLS LAST
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `

      // Get the full userWord objects with relations
      const userWordIds = userWordsWithCounts.map((uw) => uw.id)
      userWords = await prisma.userWord.findMany({
        where: {
          id: { in: userWordIds },
          ...whereClause,
        },
        include: {
          word: {
            include: {
              dictionaryWords: {
                include: {
                  dictionary: {
                    select: { id: true, name: true },
                  },
                },
              },
              tags: {
                include: {
                  tag: {
                    select: { id: true, name: true, type: true },
                  },
                },
              },
            },
          },
        },
      })

      // Sort to match the incorrect_count order
      const orderMap = new Map(userWordIds.map((id, index) => [id, index]))
      userWords.sort(
        (a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0),
      )
    } else {
      // Standard sorting
      switch (sort) {
        case 'next_due':
          orderBy = [{ nextDueAt: 'asc' }]
          break
        case 'recent':
          // Sort by most recent event - we'll need to fetch this separately
          orderBy = [{ updatedAt: 'desc' }]
          break
        case 'added':
          orderBy = [{ createdAt: 'desc' }]
          break
        default:
          orderBy = [{ nextDueAt: 'asc' }]
      }

      // Fetch user words with pagination
      userWords = await prisma.userWord.findMany({
        where: whereClause,
        include: {
          word: {
            include: {
              dictionaryWords: {
                include: {
                  dictionary: {
                    select: { id: true, name: true },
                  },
                },
              },
              tags: {
                include: {
                  tag: {
                    select: { id: true, name: true, type: true },
                  },
                },
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      })
    }

    // 6. Get last event time for each word
    const userWordIds = userWords.map((uw) => uw.id)
    const lastEvents = await prisma.userWordEvent.groupBy({
      by: ['userWordId'],
      where: {
        userWordId: { in: userWordIds },
      },
      _max: {
        createdAt: true,
      },
    })

    const lastEventMap = new Map(
      lastEvents.map((e) => [e.userWordId, e._max.createdAt]),
    )

    // 7. Get total count for pagination
    const total = await prisma.userWord.count({ where: whereClause })

    // 8. Format response
    const items = userWords.map((uw) => ({
      wordId: uw.wordId,
      lemma: uw.word.lemma,
      status: uw.status,
      stage: uw.stage,
      nextDueAt: uw.nextDueAt,
      lastEventAt: lastEventMap.get(uw.id) || null,
      dictionaries: uw.word.dictionaryWords.map((dw: any) => ({
        id: dw.dictionary.id,
        name: dw.dictionary.name,
      })),
      tags: uw.word.tags.map((wt: any) => ({
        id: wt.tag.id,
        name: wt.tag.name,
        type: wt.tag.type,
      })),
    }))

    const response: GetWordsResponse = {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }

    // Validate response
    getWordsResponseSchema.parse(response)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in GET /api/words:', error.message)
    } else {
      console.error('Unexpected error in GET /api/words:', error)
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    )
  }
}
