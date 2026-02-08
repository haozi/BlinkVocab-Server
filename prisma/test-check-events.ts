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

async function checkEvents() {
  try {
    const events = await client.userWordEvent.findMany({
      where: {
        userWordId: 'cmlba7ix90017a8jhmzsb8ad9',
        type: { in: ['answer_correct', 'answer_wrong'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    console.log('\n📋 Recent events for word:')
    events.forEach((e: any) => {
      console.log(`  - ${e.type} at ${e.createdAt.toISOString()}`)
      console.log(`    Payload: ${JSON.stringify(e.payload, null, 2)}`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.$disconnect()
    process.exit(0)
  }
}

checkEvents()
