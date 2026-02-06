import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function verify() {
  console.log('\n📊 Database Verification\n')

  // Query seed dictionary with words
  const dictionary = await prisma.dictionary.findUnique({
    where: { name: 'English Essential Vocabulary' },
    include: {
      words: {
        include: {
          word: {
            include: {
              senses: true,
            },
          },
        },
      },
      users: true,
    },
  })

  console.log(`✓ Dictionary: ${dictionary?.name}`)
  console.log(`  - Description: ${dictionary?.description}`)
  console.log(`  - Language: ${dictionary?.language}`)
  console.log(`  - Words: ${dictionary?.words.length}`)
  console.log(`  - Users: ${dictionary?.users.length}`)

  // Show first 5 words from dictionary
  console.log('\n📚 Sample Words in Dictionary:')
  if (dictionary?.words) {
    dictionary.words.slice(0, 5).forEach((dw, i) => {
      console.log(`  ${i + 1}. ${dw.word.lemma} (${dw.word.source})`)
      if (dw.word.senses.length > 0) {
        console.log(`     → ${dw.word.senses[0].definition}`)
      }
    })
    if (dictionary.words.length > 5) {
      console.log(`  ... and ${dictionary.words.length - 5} more words`)
    }
  }

  // Query user with learning progress
  const user = await prisma.user.findUnique({
    where: { email: 'seed@blinkvocab.local' },
    include: {
      userDictionaries: {
        include: {
          dictionary: true,
        },
      },
      userWords: {
        include: {
          word: true,
        },
      },
    },
  })

  console.log(`\n👤 User: ${user?.email}`)
  console.log(`  - Dictionaries: ${user?.userDictionaries.length}`)
  console.log(`  - Words in Learning: ${user?.userWords.length}`)

  if (user?.userWords && user.userWords.length > 0) {
    console.log('\n📖 User Learning Progress:')
    user.userWords.forEach((uw, i) => {
      console.log(`  ${i + 1}. ${uw.word.lemma}`)
      console.log(`     Status: ${uw.status}, Stage: ${uw.stage}`)
      if (uw.nextDueAt) {
        console.log(`     Next Due: ${uw.nextDueAt.toISOString()}`)
      }
    })
  }

  // Query user word events
  const events = await prisma.userWordEvent.findMany({
    where: { userId: user?.id },
    include: {
      word: true,
    },
  })

  console.log(`\n📝 User Word Events: ${events.length}`)
  events.forEach((event, i) => {
    console.log(`  ${i + 1}. ${event.type.toUpperCase()} - ${event.word.lemma} at ${event.createdAt.toISOString()}`)
  })

  console.log('\n✨ Verification Complete!\n')
}

verify()
  .catch((e) => {
    console.error('❌ Verification error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
