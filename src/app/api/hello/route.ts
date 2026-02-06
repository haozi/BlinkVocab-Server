import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/hello
 * Returns greeting message and retrieves words from the database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name') || 'World'

    // Retrieve sample words from database
    const words = await prisma.word.findMany({
      take: 5,
      include: {
        senses: true,
      },
    })

    return NextResponse.json(
      {
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
        database: {
          totalWords: words.length,
          words: words,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      {
        error: 'Database query failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/hello
 * Creates a new word in the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lemma, definition, language = 'en' } = body

    if (!lemma || !definition) {
      return NextResponse.json(
        { error: 'Missing required fields: lemma, definition' },
        { status: 400 },
      )
    }

    // Create new word with sense
    const word = await prisma.word.create({
      data: {
        lemma,
        language,
        source: 'custom',
        senses: {
          create: {
            definition,
            order: 0,
          },
        },
      },
      include: {
        senses: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `Word "${lemma}" created successfully!`,
        word: word,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Database error:', error)

    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'Word with this lemma and language already exists' },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        error: 'Create word failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
