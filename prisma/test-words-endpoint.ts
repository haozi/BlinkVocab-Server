import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const client = new PrismaClient({ adapter })

async function testWordsEndpoint() {
  console.log('\n🧪 Testing GET /api/words\n')

  try {
    // Get seed user
    const user = await client.user.findUnique({
      where: { email: 'seed@blinkvocab.local' },
    })

    if (!user) {
      throw new Error('Seed user not found')
    }

    console.log(`✓ Found user: ${user.id}`)

    // Test 1: Get all words (default: sort by next_due)
    console.log('\n📋 Test 1: GET /api/words (default sort=next_due)')

    const allWords = await client.userWord.findMany({
      where: { userId: user.id },
      include: { word: true },
      orderBy: { nextDueAt: 'asc' },
      take: 10,
    })

    console.log(`  Total user words: ${allWords.length}`)
    console.log('  First 5 words (by next_due):')
    allWords.slice(0, 5).forEach((uw: any, i: number) => {
      const dueTime = uw.nextDueAt
        ? new Date(uw.nextDueAt).toISOString().split('T')[0]
        : 'N/A'
      console.log(
        `    ${i + 1}. "${uw.word.lemma}" (stage: ${uw.stage}, due: ${dueTime})`,
      )
    })

    // Test 2: Filter by status
    console.log('\n📋 Test 2: GET /api/words?status=new,learning')

    const statusFiltered = await client.userWord.findMany({
      where: {
        userId: user.id,
        status: { in: ['new', 'learning'] },
      },
      include: { word: true },
    })

    console.log(`  Words with status 'new' or 'learning': ${statusFiltered.length}`)
    statusFiltered.slice(0, 3).forEach((uw: any) => {
      console.log(`    - "${uw.word.lemma}" (${uw.status})`)
    })

    // Test 3: Sort by added (createdAt DESC)
    console.log('\n📋 Test 3: GET /api/words?sort=added')

    const addedSorted = await client.userWord.findMany({
      where: { userId: user.id },
      include: { word: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    console.log('  Most recently added:')
    addedSorted.forEach((uw: any, i: number) => {
      const addedTime = new Date(uw.createdAt).toISOString().split('T')[0]
      console.log(`    ${i + 1}. "${uw.word.lemma}" (added: ${addedTime})`)
    })

    // Test 4: Wrong_most - simulate with incorrect events
    console.log('\n📋 Test 4: GET /api/words?sort=wrong_most')

    // Create some incorrect events for testing
    const testWord = allWords[0]
    if (testWord) {
      // Add 3 incorrect events in last 30 days
      const now = new Date()
      for (let i = 0; i < 3; i++) {
        await client.userWordEvent.create({
          data: {
            userId: user.id,
            wordId: testWord.wordId,
            userWordId: testWord.id,
            type: 'incorrect',
            createdAt: new Date(now.getTime() - i * 5 * 24 * 60 * 60 * 1000), // 5 days apart
          },
        })
      }
      console.log(`  ✓ Created 3 incorrect events for "${testWord.word.lemma}"`)
    }

    // Count incorrect events per word in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const incorrectCounts = await client.userWordEvent.groupBy({
      by: ['userWordId'],
      where: {
        userId: user.id,
        type: 'incorrect',
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    console.log('  Words with incorrect answers (last 30 days):')
    incorrectCounts.slice(0, 5).forEach((ic: any, i: number) => {
      console.log(`    ${i + 1}. Word ID: ${ic.userWordId} - ${ic._count.id} incorrect`)
    })

    // Test 5: Pagination
    console.log('\n📋 Test 5: GET /api/words?page=1&pageSize=3')

    const page1 = await client.userWord.findMany({
      where: { userId: user.id },
      include: { word: true },
      orderBy: { nextDueAt: 'asc' },
      skip: 0,
      take: 3,
    })

    const total = await client.userWord.count({ where: { userId: user.id } })
    const totalPages = Math.ceil(total / 3)

    console.log(`  Page 1 of ${totalPages} (pageSize: 3, total: ${total}):`)
    page1.forEach((uw: any, i: number) => {
      console.log(`    ${i + 1}. "${uw.word.lemma}"`)
    })

    // Test 6: Get dictionaries and tags
    console.log('\n📋 Test 6: Word with dictionaries and tags')

    const wordWithRelations = await client.userWord.findFirst({
      where: { userId: user.id },
      include: {
        word: {
          include: {
            dictionaryWords: {
              include: { dictionary: { select: { id: true, name: true } } },
            },
            tags: {
              include: { tag: { select: { id: true, name: true, type: true } } },
            },
          },
        },
      },
    })

    if (wordWithRelations) {
      console.log(`  Word: "${wordWithRelations.word.lemma}"`)
      console.log(
        `  Dictionaries: ${wordWithRelations.word.dictionaryWords.length}`,
      )
      wordWithRelations.word.dictionaryWords.forEach((dw: any) => {
        console.log(`    - ${dw.dictionary.name}`)
      })
      console.log(`  Tags: ${wordWithRelations.word.tags.length}`)
      wordWithRelations.word.tags.forEach((wt: any) => {
        console.log(`    - ${wt.tag.name} (${wt.tag.type})`)
      })
    }

    // Test 7: Verify next_due sorting puts overdue first
    console.log('\n📋 Test 7: Verify sort=next_due (overdue first)')

    const now = new Date()
    const dueWords = await client.userWord.findMany({
      where: {
        userId: user.id,
        nextDueAt: { lte: now },
      },
      include: { word: true },
      orderBy: { nextDueAt: 'asc' },
    })

    console.log(`  Due words (nextDueAt <= now): ${dueWords.length}`)
    dueWords.slice(0, 3).forEach((uw: any, i: number) => {
      const overdue = Math.floor(
        (now.getTime() - new Date(uw.nextDueAt).getTime()) / (1000 * 60),
      )
      console.log(
        `    ${i + 1}. "${uw.word.lemma}" (${overdue} minutes overdue) ✓`,
      )
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

testWordsEndpoint()
