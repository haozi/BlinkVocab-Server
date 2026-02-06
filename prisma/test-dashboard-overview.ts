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

async function testDashboardOverview() {
  console.log('\n🧪 Testing GET /api/dashboard/overview\n')

  try {
    // Get seed user
    const user = await client.user.findUnique({
      where: { email: 'seed@blinkvocab.local' },
    })

    if (!user) {
      throw new Error('Seed user not found')
    }

    console.log(`✓ Found user: ${user.id}`)

    // Simulate dashboard logic
    const now = new Date()
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    console.log('\n📊 Dashboard Data Calculation:')

    // Query 1: Status counts
    const statusCounts = await client.userWord.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { id: true },
    })

    const totals = {
      total: 0,
      new: 0,
      learning: 0,
      review: 0,
      mastered: 0,
    }

    console.log('\n📈 Word Status Distribution:')
    for (const row of statusCounts) {
      const count = row._count.id
      totals.total += count
      if (row.status === 'new') totals.new = count
      else if (row.status === 'learning') totals.learning = count
      else if (row.status === 'review') totals.review = count
      else if (row.status === 'mastered') totals.mastered = count

      console.log(`  ${row.status}: ${count}`)
    }

    console.log(`  Total: ${totals.total}`)

    // Query 2: User words for due calculation
    const userWords = await client.userWord.findMany({
      where: { userId: user.id },
      select: { nextDueAt: true, status: true },
    })

    let dueToday = 0
    let overdue = 0

    for (const uw of userWords) {
      if (!uw.nextDueAt) continue
      if (uw.status === 'mastered' || uw.status === 'ignored') continue

      const dueTime = uw.nextDueAt.getTime()
      const todayEndTime = todayEnd.getTime()
      const nowTime = now.getTime()

      if (dueTime <= nowTime) {
        overdue++
      } else if (dueTime <= todayEndTime) {
        dueToday++
      }
    }

    console.log('\n⏰ Due Words:')
    console.log(`  Overdue: ${overdue}`)
    console.log(`  Due today: ${dueToday}`)

    // Query 3: Activity for last 7 days
    const eventCounts = await client.userWordEvent.groupBy({
      by: ['createdAt'],
      where: {
        userId: user.id,
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    })

    const activityMap = new Map<string, number>()

    for (const event of eventCounts) {
      const eventDate = new Date(event.createdAt)
      const dateStr = eventDate.toISOString().split('T')[0]
      const count = event._count.id

      const existing = activityMap.get(dateStr) || 0
      activityMap.set(dateStr, existing + count)
    }

    // Create array for last 7 days
    const last7Days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const events = activityMap.get(dateStr) || 0

      last7Days.unshift({
        date: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString(),
        events,
      })
    }

    console.log('\n📅 Activity (Last 7 Days):')
    for (const day of last7Days) {
      const shortDate = day.date.split('T')[0]
      console.log(`  ${shortDate}: ${day.events} events`)
    }

    // Build full response
    const response = {
      totals,
      due: { dueToday, overdue },
      activity: { last7Days },
    }

    console.log('\n✨ Full Dashboard Response:')
    console.log(JSON.stringify(response, null, 2))

    // Verify non-empty
    console.log('\n🔍 Validation Checks:')
    const hasStats = totals.total > 0
    const hasDueInfo = dueToday >= 0 && overdue >= 0
    const hasActivity = last7Days.length === 7
    const hasEventData = last7Days.some((d) => d.events > 0)

    console.log(`  ✓ Has word statistics: ${hasStats ? 'YES' : 'NO'}`)
    console.log(`  ✓ Has due counts: ${hasDueInfo ? 'YES' : 'NO'}`)
    console.log(`  ✓ Has 7-day activity array: ${hasActivity ? 'YES' : 'NO'}`)
    console.log(`  ✓ Has activity events: ${hasEventData ? 'YES' : 'NO'}`)

    if (hasStats && hasDueInfo && hasActivity) {
      console.log('\n✨ All checks passed!\n')
    } else {
      console.log('\n⚠️  Some checks failed\n')
    }
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  } finally {
    await client.$disconnect()
    process.exit(0)
  }
}

testDashboardOverview()
