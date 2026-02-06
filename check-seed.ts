import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL not set')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const client = new PrismaClient({ adapter })

async function check() {
  const users = await client.user.findMany()
  const dicts = await client.dictionary.findMany()
  const words = await client.word.findMany({ take: 5 })

  console.log('Users:', users.length)
  console.log('Dictionaries:', dicts.length)
  console.log('Words:', words.length)

  if (users.length > 0) {
    console.log('First user:', users[0].email)
  }
  if (dicts.length > 0) {
    console.log('First dict:', dicts[0].name)
  }

  await client.$disconnect()
}

check()
