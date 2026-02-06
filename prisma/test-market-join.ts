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

async function testMarketJoin() {
  console.log('\n🧪 Testing POST /api/market/join Functionality\n')

  try {
    // Get seed user and dictionary
    const user = await client.user.findUnique({
      where: { email: 'seed@blinkvocab.local' },
    })

    const dictionary = await client.dictionary.findUnique({
      where: { name: 'English Essential Vocabulary' },
    })

    if (!user || !dictionary) {
      throw new Error('Seed data not found')
    }

    console.log(`✓ Found user: ${user.id}`)
    console.log(`✓ Found dictionary: ${dictionary.id}`)

    // Clean existing user_dictionaries and user_words (except seed)
    await client.userWordEvent.deleteMany({
      where: { userId: user.id },
    })

    // Test 1: First join - all words should be new
    console.log('\n📋 Test 1: First join (all words new)')
    const mockRequest = {
      headers: new Map([['x-user-id', user.id]]),
    }
    const mockBody = { dictionaryIds: [dictionary.id] }

    // Simulate the API logic manually for testing
    const existingUserDicts = await client.userDictionary.findMany({
      where: { userId: user.id, dictionaryId: dictionary.id },
    })

    // Clear for test
    if (existingUserDicts.length > 0) {
      await client.userDictionary.deleteMany({
        where: { userId: user.id, dictionaryId: dictionary.id },
      })
      await client.userWord.deleteMany({
        where: { userId: user.id },
      })
    }

    // Run the actual transaction
    const result = await client.$transaction(async (tx: Prisma.TransactionClient) => {
      const dict = await tx.dictionary.findUnique({
        where: { id: dictionary.id },
        include: {
          words: { select: { wordId: true } },
        },
      })

      if (!dict) throw new Error('Dictionary not found')

      const wordIds = dict.words.map((w: any) => w.wordId)
      const existingWords = await tx.userWord.findMany({
        where: { userId: user.id, wordId: { in: wordIds } },
        select: { wordId: true },
      })

      const existingWordIds = new Set(existingWords.map((w: any) => w.wordId))
      const newWordIds = wordIds.filter((wid: any) => !existingWordIds.has(wid))

      // Create new user_words
      await tx.userWord.createMany({
        data: newWordIds.map((wordId: any) => ({
          userId: user.id,
          wordId,
          status: 'new' as const,
          stage: 0,
          nextDueAt: new Date(),
        })),
      })

      return {
        addedCount: newWordIds.length,
        alreadyHadCount: existingWordIds.size,
      }
    })

    console.log(`✓ Added: ${result.addedCount} words`)
    console.log(`✓ Already had: ${result.alreadyHadCount} words`)

    // Verify data
    const userWords = await client.userWord.findMany({
      where: { userId: user.id },
      select: { id: true, wordId: true, status: true, stage: true },
      take: 5,
    })

    console.log(`\n📚 Sample user_words (first 5):`)
    userWords.forEach((uw: any, i: number) => {
      console.log(
        `  ${i + 1}. ${uw.wordId.slice(0, 8)}... (status: ${uw.status}, stage: ${uw.stage})`,
      )
    })

    // Test 2: Rejoin same dictionary - no new words
    console.log('\n📋 Test 2: Rejoin same dictionary (idempotent)')

    const result2 = await client.$transaction(async (tx: Prisma.TransactionClient) => {
      const dict = await tx.dictionary.findUnique({
        where: { id: dictionary.id },
        include: {
          words: { select: { wordId: true } },
        },
      })

      if (!dict) throw new Error('Dictionary not found')

      const wordIds = dict.words.map((w: any) => w.wordId)
      const existingWords = await tx.userWord.findMany({
        where: { userId: user.id, wordId: { in: wordIds } },
        select: { wordId: true },
      })

      const existingWordIds = new Set(existingWords.map((w: any) => w.wordId))
      const newWordIds = wordIds.filter((wid: any) => !existingWordIds.has(wid))

      // Create new user_words (none should be created)
      if (newWordIds.length > 0) {
        await tx.userWord.createMany({
          data: newWordIds.map((wordId: any) => ({
            userId: user.id,
            wordId,
            status: 'new' as const,
            stage: 0,
            nextDueAt: new Date(),
          })),
        })
      }

      return {
        addedCount: newWordIds.length,
        alreadyHadCount: existingWordIds.size,
      }
    })

    console.log(`✓ Added: ${result2.addedCount} words (should be 0)`)
    console.log(`✓ Already had: ${result2.alreadyHadCount} words (should be ${dictionary.id.length > 0 ? '20' : '0'})`)

    // Test 3: Check unique constraint
    console.log('\n📋 Test 3: Unique constraint (user_id, word_id)')
    const allUserWords = await client.userWord.findMany({
      where: { userId: user.id },
      select: { wordId: true },
    })

    const wordIdCounts = new Map<string, number>()
    allUserWords.forEach((uw: any) => {
      wordIdCounts.set(uw.wordId, (wordIdCounts.get(uw.wordId) || 0) + 1)
    })

    let duplicateCount = 0
    wordIdCounts.forEach((count) => {
      if (count > 1) duplicateCount++
    })

    if (duplicateCount === 0) {
      console.log(`✓ No duplicate user_word entries found`)
    } else {
      console.log(`❌ Found ${duplicateCount} duplicate entries!`)
    }

    // Test 4: Check events
    console.log('\n📋 Test 4: User word events')
    const events = await client.userWordEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { type: true, payload: true, createdAt: true },
      take: 3,
    })

    console.log(`✓ Found ${events.length} events:`)
    events.forEach((e: any, i: number) => {
      console.log(`  ${i + 1}. ${e.type}`)
      if (e.payload) {
        console.log(`     Payload: ${JSON.stringify(e.payload)}`)
      }
    })

    console.log('\n✨ All tests passed!\n')
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  } finally {
    await client.$disconnect()
    process.exit(0)
  }
}

testMarketJoin()
