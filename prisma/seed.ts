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

async function main() {
  console.log('🌱 Seeding database...')

  // Clean up existing data (cascade will handle relations)
  await prisma.userWordEvent.deleteMany()
  await prisma.userWord.deleteMany()
  await prisma.userDictionary.deleteMany()
  await prisma.dictionaryWord.deleteMany()
  await prisma.wordTag.deleteMany()
  await prisma.wordSense.deleteMany()
  await prisma.word.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.dictionary.deleteMany()
  await prisma.user.deleteMany()

  // Create seed user with fixed ID for MVP development
  const user = await prisma.user.create({
    data: {
      id: 'dev-user-123',
      email: 'dev@blinkvocab.local',
    },
  })
  console.log(`✓ Created user: ${user.email} (ID: ${user.id})`)

  // Create tags (for dictionary tagging)
  const dictTag = await prisma.tag.create({
    data: {
      name: 'seed-dictionary',
      type: 'dictionary',
    },
  })

  // Create seed dictionary
  const dictionary = await prisma.dictionary.create({
    data: {
      name: 'English Essential Vocabulary',
      description: 'Essential vocabulary for language learners',
      language: 'en',
    },
  })
  console.log(`✓ Created dictionary: ${dictionary.name}`)

  // Create 20 seed words
  const words = await Promise.all(
    [
      { lemma: 'abundant', definition: 'existing or available in large quantities', pos: 'adj' },
      { lemma: 'accommodate', definition: 'to provide lodging or sufficient space', pos: 'v' },
      { lemma: 'achieve', definition: 'to successfully bring about or reach a goal', pos: 'v' },
      { lemma: 'acknowledge', definition: 'to recognize the existence or truth of', pos: 'v' },
      { lemma: 'acquire', definition: 'to obtain or gain possession of', pos: 'v' },
      { lemma: 'adapt', definition: 'to adjust to new conditions or environment', pos: 'v' },
      { lemma: 'adequate', definition: 'satisfactory or sufficient in quality or quantity', pos: 'adj' },
      { lemma: 'adjacent', definition: 'next to or adjoining something else', pos: 'adj' },
      { lemma: 'advance', definition: 'to move forward or make progress', pos: 'v' },
      { lemma: 'advocate', definition: 'to publicly support or recommend a cause', pos: 'v' },
      { lemma: 'affect', definition: 'to influence or change something', pos: 'v' },
      { lemma: 'aggregate', definition: 'a collection or combination of things', pos: 'n' },
      { lemma: 'agree', definition: 'to have the same opinion or consent', pos: 'v' },
      { lemma: 'alert', definition: 'watchful and quick to notice danger', pos: 'adj' },
      { lemma: 'allocate', definition: 'to distribute or assign resources', pos: 'v' },
      { lemma: 'ally', definition: 'a state or group formally associated with another', pos: 'n' },
      { lemma: 'ambiguous', definition: 'open to more than one interpretation', pos: 'adj' },
      { lemma: 'amend', definition: 'to change or modify something officially', pos: 'v' },
      { lemma: 'analog', definition: 'comparable in certain respects', pos: 'adj' },
      { lemma: 'analyze', definition: 'to examine something systematically', pos: 'v' },
    ].map(async (wordData) => {
      const word = await prisma.word.create({
        data: {
          lemma: wordData.lemma,
          language: 'en',
          source: 'seed',
          senses: {
            create: {
              definition: wordData.definition,
              pos: wordData.pos,
              order: 0,
              examples: {
                examples: [
                  `Example sentence for "${wordData.lemma}"`,
                  `Another usage of "${wordData.lemma}" in context`,
                ],
              },
            },
          },
        },
        include: { senses: true },
      })
      return word
    }),
  )
  console.log(`✓ Created 20 seed words`)

  // Add words to dictionary
  await Promise.all(
    words.map((word) =>
      prisma.dictionaryWord.create({
        data: {
          dictionaryId: dictionary.id,
          wordId: word.id,
        },
      }),
    ),
  )
  console.log(`✓ Added 20 words to dictionary`)

  // Add dictionary to user
  await prisma.userDictionary.create({
    data: {
      userId: user.id,
      dictionaryId: dictionary.id,
    },
  })
  console.log(`✓ Added dictionary to user`)

  // Create sample user word records with varied statuses
  const allWords = words
  const wordStatuses = [
    { word: allWords[0], status: 'new' as const, daysDue: -2 }, // Overdue
    { word: allWords[1], status: 'learning' as const, daysDue: 0 }, // Due today
    { word: allWords[2], status: 'learning' as const, daysDue: 1 }, // Tomorrow
    { word: allWords[3], status: 'review' as const, daysDue: 3 }, // 3 days
    { word: allWords[4], status: 'review' as const, daysDue: 5 }, // 5 days
    { word: allWords[5], status: 'mastered' as const, daysDue: 7 }, // Mastered
  ]

  const userWords = await Promise.all(
    wordStatuses.map((item) =>
      prisma.userWord.create({
        data: {
          userId: user.id,
          wordId: item.word.id,
          status: item.status,
          stage: item.status === 'new' ? 0 : item.status === 'learning' ? 1 : item.status === 'review' ? 2 : 3,
          nextDueAt: new Date(Date.now() + item.daysDue * 24 * 60 * 60 * 1000),
        },
      }),
    ),
  )
  console.log(`✓ Created 6 sample user-word records with varied statuses`)

  // Create sample events across multiple days
  const eventDates = [
    { daysAgo: 6, count: 1 },
    { daysAgo: 5, count: 2 },
    { daysAgo: 4, count: 1 },
    { daysAgo: 2, count: 3 },
    { daysAgo: 1, count: 2 },
    { daysAgo: 0, count: 4 }, // Today
  ]

  let eventCount = 0
  for (const { daysAgo, count } of eventDates) {
    const eventDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    for (let i = 0; i < count; i++) {
      const userWord = userWords[i % userWords.length]
      await prisma.userWordEvent.create({
        data: {
          userId: user.id,
          wordId: userWord.wordId,
          userWordId: userWord.id,
          type: ['view', 'correct', 'incorrect', 'skip'][i % 4],
          createdAt: eventDate,
          payload: { accuracy: Math.random() > 0.5 ? 1 : 0 },
        },
      })
      eventCount++
    }
  }
  console.log(`✓ Created ${eventCount} sample user word events across 6 days`)

  console.log('✨ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
