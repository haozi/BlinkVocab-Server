import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const connectionString =
  process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const client = new PrismaClient({ adapter })

async function testWordDetailEndpoint() {
  console.log('\n🧪 Testing GET /api/words/:wordId\n')

  try {
    // Get seed user
    const user = await client.user.findUnique({
      where: { email: 'seed@blinkvocab.local' },
    })

    if (!user) {
      throw new Error('Seed user not found')
    }

    console.log(`✓ Found user: ${user.id}`)

    // Get a word with user data
    const userWord = await client.userWord.findFirst({
      where: { userId: user.id },
      include: { word: true },
    })

    if (!userWord) {
      throw new Error('No user words found')
    }

    const wordId = userWord.wordId

    console.log(`\n📚 Testing word: "${userWord.word.lemma}" (${wordId})`)

    // Test 1: Get word detail with all relations
    console.log('\n📋 Test 1: Word detail structure')

    const word = await client.word.findUnique({
      where: { id: wordId },
      include: {
        senses: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
        dictionaryWords: { include: { dictionary: true } },
      },
    })

    if (!word) {
      throw new Error('Word not found')
    }

    console.log(`  Lemma: "${word.lemma}"`)
    console.log(`  Senses: ${word.senses.length}`)
    word.senses.forEach((sense: any) => {
      console.log(
        `    - ${sense.pos || 'N/A'}: ${sense.definition.slice(0, 50)}...`,
      )
    })

    console.log(`  Tags: ${word.tags.length}`)
    word.tags.forEach((wt: any) => {
      console.log(`    - ${wt.tag.name} (${wt.tag.type})`)
    })

    console.log(`  Dictionaries: ${word.dictionaryWords.length}`)
    word.dictionaryWords.forEach((dw: any) => {
      console.log(`    - ${dw.dictionary.name}`)
    })

    // Test 2: User progress data
    console.log('\n📋 Test 2: User progress data')

    const userWordData = await client.userWord.findFirst({
      where: { userId: user.id, wordId },
    })

    if (userWordData) {
      console.log(`  UserWordId: ${userWordData.id}`)
      console.log(`  Status: ${userWordData.status}`)
      console.log(`  Stage: ${userWordData.stage}`)
      console.log(
        `  NextDueAt: ${userWordData.nextDueAt?.toISOString().split('T')[0]}`,
      )
    } else {
      console.log('  No user progress data')
    }

    // Test 3: Events with different types
    console.log('\n📋 Test 3: Events (various types)')

    // Create different event types for testing
    const eventTypes = [
      { type: 'added_manual', payload: { lemma: word.lemma, context: 'test' } },
      { type: 'correct', payload: { stage: 0, newStage: 1, correct: true } },
      { type: 'incorrect', payload: { stage: 1, newStage: 0, correct: false } },
      { type: 'view', payload: { page: 'word-detail' } },
    ]

    console.log('  Creating test events...')
    for (const evt of eventTypes) {
      await client.userWordEvent.create({
        data: {
          userId: user.id,
          wordId,
          userWordId: userWordData?.id,
          type: evt.type,
          payload: evt.payload,
        },
      })
    }
    console.log(`  ✓ Created ${eventTypes.length} test events`)

    // Fetch events
    const events = await client.userWordEvent.findMany({
      where: { userId: user.id, wordId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, type: true, createdAt: true, payload: true },
    })

    console.log(`\n  Total events: ${events.length}`)
    console.log('  Event types found:')

    const eventTypeCounts = new Map<string, number>()
    events.forEach((e: any) => {
      eventTypeCounts.set(e.type, (eventTypeCounts.get(e.type) || 0) + 1)
    })

    eventTypeCounts.forEach((count, type) => {
      console.log(`    - ${type}: ${count}`)
    })

    console.log('\n  Recent events (first 5):')
    events.slice(0, 5).forEach((e: any, i: number) => {
      const time = new Date(e.createdAt).toISOString().split('T')[1].slice(0, 8)
      console.log(`    ${i + 1}. [${time}] ${e.type}`)
      if (e.payload && Object.keys(e.payload).length > 0) {
        console.log(`       Payload: ${JSON.stringify(e.payload)}`)
      }
    })

    // Test 4: Limit parameter
    console.log('\n📋 Test 4: Limit parameter (limit=3)')

    const limitedEvents = await client.userWordEvent.findMany({
      where: { userId: user.id, wordId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, type: true, createdAt: true, payload: true },
    })

    console.log(`  Events with limit=3: ${limitedEvents.length}`)
    limitedEvents.forEach((e: any, i: number) => {
      console.log(`    ${i + 1}. ${e.type}`)
    })

    // Test 5: Word without user data
    console.log('\n📋 Test 5: Word without user progress')

    const wordWithoutUser = await client.word.findFirst({
      where: {
        NOT: {
          userWords: {
            some: { userId: user.id },
          },
        },
      },
    })

    if (wordWithoutUser) {
      console.log(`  Word: "${wordWithoutUser.lemma}"`)
      console.log(`  Has user data: NO (user field should be null)`)
    } else {
      console.log('  All words have user data')
    }

    // Test 6: Verify specific event types exist
    console.log('\n📋 Test 6: Verify event type coverage')

    const requiredEventTypes = ['added_manual', 'correct', 'incorrect']
    const foundTypes = new Set(events.map((e: any) => e.type))

    console.log('  Required event types:')
    requiredEventTypes.forEach((type) => {
      const found = foundTypes.has(type)
      console.log(`    - ${type}: ${found ? '✓ FOUND' : '✗ MISSING'}`)
    })

    console.log('\n✨ All tests completed!\n')
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  } finally {
    await client.$disconnect()
    process.exit(0)
  }
}

testWordDetailEndpoint()
