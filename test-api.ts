import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL not set')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const client = new PrismaClient({ adapter })

async function test() {
  const user = await client.user.findFirst({ where: { email: 'seed@blinkvocab.local' } })
  const dict = await client.dictionary.findFirst({ where: { name: 'English Essential Vocabulary' } })

  if (!user || !dict) {
    console.error('Seed data missing')
    process.exit(1)
  }

  console.log(`User: ${user.id}`)
  console.log(`Dict: ${dict.id}`)

  // Clear user data for fresh test
  await client.userWordEvent.deleteMany({ where: { userId: user.id } })
  await client.userWord.deleteMany({ where: { userId: user.id } })
  await client.userDictionary.deleteMany({ where: { userId: user.id } })

  console.log('✓ Cleared user data for fresh test')

  // Call API
  const response = await fetch('http://localhost:3000/api/market/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
    },
    body: JSON.stringify({
      dictionaryIds: [dict.id],
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('API error:', response.status, data)
    process.exit(1)
  }

  console.log('\n✨ API Response:')
  console.log(JSON.stringify(data, null, 2))

  // Verify the data was created
  const userWords = await client.userWord.findMany({ where: { userId: user.id } })
  const events = await client.userWordEvent.findMany({ where: { userId: user.id } })

  console.log(`\n✓ Created ${userWords.length} user_words`)
  console.log(`✓ Created ${events.length} events`)

  await client.$disconnect()
}

test().catch(console.error)
