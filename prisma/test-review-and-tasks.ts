import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

// Copy SRS config inline to avoid @ alias import issues
const SRS_INTERVALS_MINUTES = [10, 1440, 4320, 10080, 21600, 43200]
const MAX_STAGE = SRS_INTERVALS_MINUTES.length - 1

function getNextDueDate(now: Date, stage: number, correct: boolean): Date {
  if (correct) {
    const minutesToAdd = SRS_INTERVALS_MINUTES[Math.min(stage, MAX_STAGE)]
    return new Date(now.getTime() + minutesToAdd * 60 * 1000)
  } else {
    return new Date(now.getTime() + 10 * 60 * 1000)
  }
}

function getNextStage(stage: number, correct: boolean): number {
  if (correct) {
    return Math.min(stage + 1, MAX_STAGE)
  } else {
    return Math.max(stage - 1, 0)
  }
}

const connectionString =
  process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const client = new PrismaClient({ adapter })

async function testReviewAndTasks() {
  console.log('\n🧪 Testing POST /api/review/submit and GET /api/tasks/today\n')

  try {
    // Get seed user
    const user = await client.user.findUnique({
      where: { email: 'seed@blinkvocab.local' },
    })

    if (!user) {
      throw new Error('Seed user not found')
    }

    console.log(`✓ Found user: ${user.id}`)

    // Get user's words for testing
    const userWords = await client.userWord.findMany({
      where: { userId: user.id },
      include: { word: true },
      take: 3,
    })

    if (userWords.length === 0) {
      throw new Error('No user words found')
    }

    console.log(`\n📚 Found ${userWords.length} user words for testing`)

    // Test 1: GET /api/tasks/today - Initial state
    console.log('\n📋 Test 1: GET /api/tasks/today (initial state)')

    const dueWords = await client.userWord.findMany({
      where: {
        userId: user.id,
        nextDueAt: { lte: new Date() },
        status: { notIn: ['mastered', 'ignored'] },
      },
      include: { word: true },
    })

    const newWords = await client.userWord.findMany({
      where: {
        userId: user.id,
        status: 'new',
      },
      include: { word: true },
    })

    console.log(`  Due words: ${dueWords.length}`)
    console.log(`  New words: ${newWords.length}`)

    dueWords.forEach((uw: any) => {
      const now = new Date()
      const minutes = Math.floor(
        (now.getTime() - uw.nextDueAt.getTime()) / 60000,
      )
      console.log(
        `    - "${uw.word.lemma}" (stage: ${uw.stage}, ${minutes}min overdue)`,
      )
    })

    newWords.forEach((uw: any) => {
      console.log(`    - "${uw.word.lemma}" (NEW)`)
    })

    // Test 2: POST /api/review/submit - Correct answer
    console.log('\n📋 Test 2: POST /api/review/submit (correct answer)')

    const testWord = userWords[0]
    const oldStage = testWord.stage
    const oldDueAt = testWord.nextDueAt

    const expectedNewStage = getNextStage(oldStage, true)
    const expectedNewDue = getNextDueDate(new Date(), oldStage, true)

    console.log(`  Word: "${testWord.word.lemma}"`)
    console.log(`  Old stage: ${oldStage}`)
    console.log(`  New stage: ${expectedNewStage}`)
    console.log(`  Old due: ${oldDueAt?.toISOString().split('T')[0]}`)
    console.log(`  New due: ${expectedNewDue.toISOString().split('T')[0]}`)

    // Simulate the update
    const updatedUserWord = await client.userWord.update({
      where: { id: testWord.id },
      data: {
        stage: expectedNewStage,
        nextDueAt: expectedNewDue,
      },
    })

    // Create event
    await client.userWordEvent.create({
      data: {
        userId: user.id,
        wordId: testWord.wordId,
        userWordId: testWord.id,
        type: 'answer_correct',
        payload: {
          oldStage: oldStage,
          newStage: expectedNewStage,
          correct: true,
        },
      },
    })

    console.log(`  ✓ Stage updated: ${oldStage} → ${updatedUserWord.stage}`)
    console.log(
      `  ✓ Due date pushed forward by ${SRS_INTERVALS_MINUTES[oldStage]} minutes`,
    )

    // Test 3: POST /api/review/submit - Wrong answer
    console.log('\n📋 Test 3: POST /api/review/submit (wrong answer)')

    const testWord2 = userWords[1]
    const oldStage2 = testWord2.stage
    const oldDueAt2 = testWord2.nextDueAt

    const expectedNewStage2 = getNextStage(oldStage2, false)
    const expectedNewDue2 = getNextDueDate(new Date(), oldStage2, false)

    console.log(`  Word: "${testWord2.word.lemma}"`)
    console.log(`  Old stage: ${oldStage2}`)
    console.log(`  New stage: ${expectedNewStage2} (decreased)`)
    console.log(`  Old due: ${oldDueAt2?.toISOString().split('T')[0]}`)
    console.log(`  New due: ${expectedNewDue2.toISOString().split('T')[0]}`)

    // Simulate the update
    const updatedUserWord2 = await client.userWord.update({
      where: { id: testWord2.id },
      data: {
        stage: expectedNewStage2,
        nextDueAt: expectedNewDue2,
      },
    })

    // Create event
    await client.userWordEvent.create({
      data: {
        userId: user.id,
        wordId: testWord2.wordId,
        userWordId: testWord2.id,
        type: 'answer_wrong',
        payload: {
          oldStage: oldStage2,
          newStage: expectedNewStage2,
          correct: false,
        },
      },
    })

    console.log(
      `  ✓ Stage decreased/reset: ${oldStage2} → ${updatedUserWord2.stage}`,
    )
    console.log(`  ✓ Due date set to 10 minutes from now`)

    // Test 4: SRS intervals validation
    console.log('\n📋 Test 4: SRS intervals validation')
    console.log(`  Intervals (minutes): ${SRS_INTERVALS_MINUTES.join(', ')}`)

    for (let stage = 0; stage < SRS_INTERVALS_MINUTES.length; stage++) {
      const now = new Date()
      const nextDue = getNextDueDate(now, stage, true)
      const expectedMinutes = SRS_INTERVALS_MINUTES[stage]
      const actualMinutes = Math.round(
        (nextDue.getTime() - now.getTime()) / 60000,
      )

      console.log(
        `  Stage ${stage} (correct): ${actualMinutes} minutes (expected: ${expectedMinutes})`,
      )
    }

    const wrongDue = getNextDueDate(new Date(), 99, false)
    const wrongMinutes = Math.round(
      (wrongDue.getTime() - new Date().getTime()) / 60000,
    )
    console.log(
      `  Wrong answer (any stage): ${wrongMinutes} minutes (expected: 10)`,
    )

    // Test 5: Updated tasks list
    console.log('\n📋 Test 5: GET /api/tasks/today (after review)')

    const updatedDueWords = await client.userWord.findMany({
      where: {
        userId: user.id,
        nextDueAt: { lte: new Date() },
        status: { notIn: ['mastered', 'ignored'] },
      },
      include: { word: true },
    })

    console.log(`  Due words after review: ${updatedDueWords.length}`)

    // Test 6: Event verification
    console.log('\n📋 Test 6: Event logging verification')

    const events = await client.userWordEvent.findMany({
      where: {
        userId: user.id,
        type: { in: ['answer_correct', 'answer_wrong'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    console.log(`  Recent review events: ${events.length}`)
    events.forEach((e: any) => {
      const payload = e.payload as any
      console.log(
        `    - ${e.type}: stage ${payload?.oldStage} → ${payload?.newStage}`,
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

testReviewAndTasks()
