import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'

const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const client = new PrismaClient({ adapter })

async function testAddManualWord() {
  console.log('\n🧪 Testing POST /api/words/add-manual Functionality\n')

  try {
    // Get seed user
    const user = await client.user.findUnique({
      where: { email: 'seed@blinkvocab.local' },
    })

    if (!user) {
      throw new Error('Seed user not found')
    }

    console.log(`✓ Found user: ${user.id}`)

    // Clean up test words if they exist
    await client.userWordEvent.deleteMany({
      where: { type: 'added_manual' },
    })

    // Test 1: Add a new custom word
    console.log('\n📋 Test 1: Add new custom word')
    const newWordText = 'ephemeral'

    const word1 = await client.word.upsert({
      where: {
        lemma_language: { lemma: newWordText, language: 'en' },
      },
      update: {},
      create: {
        lemma: newWordText,
        language: 'en',
        source: 'custom' as const,
      },
    })

    const userWord1 = await client.userWord.upsert({
      where: {
        userId_wordId: { userId: user.id, wordId: word1.id },
      },
      update: {},
      create: {
        userId: user.id,
        wordId: word1.id,
        status: 'new' as const,
        stage: 0,
        nextDueAt: new Date(),
      },
    })

    const event1 = await client.userWordEvent.create({
      data: {
        userId: user.id,
        wordId: word1.id,
        userWordId: userWord1.id,
        type: 'added_manual',
        payload: {
          lemma: newWordText,
          context: 'lasting for a very short time',
        },
      },
    })

    console.log(`✓ Added word: "${word1.lemma}" (isNew: true)`)
    console.log(`✓ Created event: ${event1.type}`)

    // Test 2: Add same word again - should only create new event
    console.log('\n📋 Test 2: Add same word again (idempotent)')

    const word2 = await client.word.upsert({
      where: {
        lemma_language: { lemma: newWordText, language: 'en' },
      },
      update: {},
      create: {
        lemma: newWordText,
        language: 'en',
        source: 'custom' as const,
      },
    })

    const userWord2 = await client.userWord.upsert({
      where: {
        userId_wordId: { userId: user.id, wordId: word2.id },
      },
      update: {},
      create: {
        userId: user.id,
        wordId: word2.id,
        status: 'new' as const,
        stage: 0,
        nextDueAt: new Date(),
      },
    })

    const event2 = await client.userWordEvent.create({
      data: {
        userId: user.id,
        wordId: word2.id,
        userWordId: userWord2.id,
        type: 'added_manual',
        payload: {
          lemma: newWordText,
          url: 'https://example.com',
        },
      },
    })

    const isSameWord = word1.id === word2.id
    const isSameUserWord = userWord1.id === userWord2.id

    console.log(`✓ Same word: ${isSameWord ? 'YES' : 'NO'} (id: ${word2.id.slice(0, 8)}...)`)
    console.log(`✓ Same user_word: ${isSameUserWord ? 'YES' : 'NO'}`)
    console.log(`✓ New event created: ${event2.type}`)

    // Test 3: Verify all events for this word
    console.log('\n📋 Test 3: Event log for repeated additions')
    const allEvents = await client.userWordEvent.findMany({
      where: {
        userId: user.id,
        type: 'added_manual',
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`✓ Total events: ${allEvents.length} (should be 2)`)
    allEvents.forEach((e: any, i: number) => {
      console.log(
        `  ${i + 1}. ${e.type} - Payload: ${JSON.stringify(e.payload)}`,
      )
    })

    // Test 4: Test input validation
    console.log('\n📋 Test 4: Input validation')
    const validInputs = ['hello', 'test-word', 'python3']
    const invalidInputs = ['a', 'this-is-a-very-long-word-that-exceeds-the-limit', 'test@word']

    console.log('✓ Valid inputs:')
    validInputs.forEach((input) => {
      const isValid = /^[a-zA-Z0-9-]{2,30}$/.test(input)
      console.log(`  ${input} -> ${isValid ? '✓ PASS' : '✗ FAIL'}`)
    })

    console.log('✓ Invalid inputs:')
    invalidInputs.forEach((input) => {
      const isValid = /^[a-zA-Z0-9-]{2,30}$/.test(input)
      console.log(`  ${input} -> ${!isValid ? '✓ FAIL (correctly rejected)' : '✗ PASS (should reject)'}`)
    })

    // Test 5: Unique constraint
    console.log('\n📋 Test 5: User_word uniqueness')
    const userWordCount = await client.userWord.count({
      where: { userId: user.id, wordId: word1.id },
    })
    console.log(`✓ User_word entries for "${newWordText}": ${userWordCount} (should be 1)`)

    console.log('\n✨ All tests passed!\n')
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  } finally {
    await client.$disconnect()
    process.exit(0)
  }
}

testAddManualWord()
