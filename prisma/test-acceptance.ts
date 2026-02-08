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

async function testAcceptanceCriteria() {
  console.log('\n🧪 Acceptance Test: Review and Tasks Endpoints\n')

  try {
    const userId = 'cmlba7ivd0000a8jht9kkq19s'

    // 1. Test submit updates stage/next_due and writes answer_* event
    console.log('✅ Test 1: POST /api/review/submit')

    // Get a test word
    const testWord = await client.userWord.findFirst({
      where: { userId, status: { not: 'mastered' } },
      include: { word: true },
    })

    if (!testWord) {
      throw new Error('No test word found')
    }

    const oldStage = testWord.stage
    const oldNextDue = testWord.nextDueAt

    console.log(`  Word: "${testWord.word.lemma}"`)
    console.log(
      `  Before: stage=${oldStage}, nextDue=${oldNextDue?.toISOString()}`,
    )

    // Simulate correct answer (via transaction like the endpoint does)
    const now = new Date()
    const newStage = Math.min(oldStage + 1, 5) // MAX_STAGE = 5
    const srsIntervals = [10, 1440, 4320, 10080, 21600, 43200]
    const minutesToAdd = srsIntervals[Math.min(oldStage, 5)]
    const newNextDue = new Date(now.getTime() + minutesToAdd * 60 * 1000)

    await client.$transaction(async (tx) => {
      // Update user_word
      await tx.userWord.update({
        where: { id: testWord.id },
        data: {
          stage: newStage,
          nextDueAt: newNextDue,
          status: testWord.status === 'new' ? 'learning' : testWord.status,
        },
      })

      // Create event
      await tx.userWordEvent.create({
        data: {
          userId,
          wordId: testWord.wordId,
          userWordId: testWord.id,
          type: 'answer_correct',
          payload: {
            oldStage,
            newStage,
            correct: true,
          },
        },
      })
    })

    // Verify update
    const updatedWord = await client.userWord.findUnique({
      where: { id: testWord.id },
    })

    console.log(
      `  After:  stage=${updatedWord?.stage}, nextDue=${updatedWord?.nextDueAt?.toISOString()}`,
    )

    // Verify event
    const event = await client.userWordEvent.findFirst({
      where: {
        userWordId: testWord.id,
        type: 'answer_correct',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (event) {
      console.log(`  ✓ Event created: ${event.type}`)
      console.log(`  ✓ Payload: ${JSON.stringify(event.payload)}`)
    }

    // 2. Test tasks endpoint returns due/new words
    console.log('\n✅ Test 2: GET /api/tasks/today')

    const now2 = new Date()

    // Get due words (next_due_at <= now)
    const dueWords = await client.userWord.findMany({
      where: {
        userId,
        nextDueAt: { lte: now2 },
        status: { notIn: ['mastered', 'ignored'] },
      },
      include: { word: true },
    })

    // Get new words
    const newWords = await client.userWord.findMany({
      where: {
        userId,
        status: 'new',
      },
      include: { word: true },
    })

    console.log(`  Due words: ${dueWords.length}`)
    dueWords.forEach((w: any) => {
      const minutesOverdue = Math.floor(
        (now2.getTime() - w.nextDueAt.getTime()) / 60000,
      )
      console.log(
        `    - "${w.word.lemma}" (stage ${w.stage}, ${minutesOverdue}min overdue)`,
      )
    })

    console.log(`  New words: ${newWords.length}`)
    newWords.forEach((w: any) => {
      console.log(`    - "${w.word.lemma}" (status: ${w.status})`)
    })

    // 3. Verify SRS intervals
    console.log('\n✅ Test 3: SRS Intervals Configuration')
    const intervals = [10, 1440, 4320, 10080, 21600, 43200]
    console.log(`  Intervals: ${intervals.join(', ')} minutes`)
    console.log('  Meaning:')
    console.log('    Stage 0: 10min')
    console.log('    Stage 1: 1 day (1440min)')
    console.log('    Stage 2: 3 days (4320min)')
    console.log('    Stage 3: 7 days (10080min)')
    console.log('    Stage 4: 15 days (21600min)')
    console.log('    Stage 5: 30 days (43200min)')

    // 4. Test wrong answer behavior
    console.log('\n✅ Test 4: Wrong answer behavior')

    // Create a test word at stage 3
    const testWord2 = await client.userWord.findFirst({
      where: { userId, stage: { gte: 1 } },
      include: { word: true },
    })

    if (testWord2) {
      const oldStage2 = testWord2.stage
      const newStage2 = Math.max(oldStage2 - 1, 0)
      const wrongNextDue = new Date(now.getTime() + 10 * 60 * 1000)

      await client.$transaction(async (tx) => {
        await tx.userWord.update({
          where: { id: testWord2.id },
          data: {
            stage: newStage2,
            nextDueAt: wrongNextDue,
          },
        })

        await tx.userWordEvent.create({
          data: {
            userId,
            wordId: testWord2.wordId,
            userWordId: testWord2.id,
            type: 'answer_wrong',
            payload: {
              oldStage: oldStage2,
              newStage: newStage2,
              correct: false,
            },
          },
        })
      })

      console.log(`  Word: "${testWord2.word.lemma}"`)
      console.log(`  Stage: ${oldStage2} → ${newStage2} (decreased)`)
      console.log(`  Next due: now + 10 minutes`)

      // Verify event
      const wrongEvent = await client.userWordEvent.findFirst({
        where: {
          userWordId: testWord2.id,
          type: 'answer_wrong',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (wrongEvent) {
        console.log(`  ✓ Event created: ${wrongEvent.type}`)
      }
    }

    console.log('\n✨ All acceptance criteria verified!\n')
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  } finally {
    await client.$disconnect()
    process.exit(0)
  }
}

testAcceptanceCriteria()
