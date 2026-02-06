-- CreateEnum
CREATE TYPE "WordSource" AS ENUM ('seed', 'custom');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('dictionary', 'topic', 'level');

-- CreateEnum
CREATE TYPE "UserWordStatus" AS ENUM ('new', 'learning', 'review', 'mastered', 'ignored');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "lemma" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "source" "WordSource" NOT NULL DEFAULT 'seed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordSense" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "pos" TEXT,
    "definition" TEXT NOT NULL,
    "examples" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WordSense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TagType" NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordTag" (
    "wordId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "WordTag_pkey" PRIMARY KEY ("wordId","tagId")
);

-- CreateTable
CREATE TABLE "Dictionary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictionaryWord" (
    "dictionaryId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,

    CONSTRAINT "DictionaryWord_pkey" PRIMARY KEY ("dictionaryId","wordId")
);

-- CreateTable
CREATE TABLE "UserDictionary" (
    "userId" TEXT NOT NULL,
    "dictionaryId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDictionary_pkey" PRIMARY KEY ("userId","dictionaryId")
);

-- CreateTable
CREATE TABLE "UserWord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "status" "UserWordStatus" NOT NULL DEFAULT 'new',
    "stage" INTEGER NOT NULL DEFAULT 0,
    "nextDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWordEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "userWordId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWordEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Word_language_idx" ON "Word"("language");

-- CreateIndex
CREATE INDEX "Word_source_idx" ON "Word"("source");

-- CreateIndex
CREATE UNIQUE INDEX "words_lemma_language_key" ON "Word"("lemma", "language");

-- CreateIndex
CREATE INDEX "WordSense_wordId_idx" ON "WordSense"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_type_idx" ON "Tag"("type");

-- CreateIndex
CREATE INDEX "WordTag_tagId_idx" ON "WordTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Dictionary_name_key" ON "Dictionary"("name");

-- CreateIndex
CREATE INDEX "Dictionary_language_idx" ON "Dictionary"("language");

-- CreateIndex
CREATE INDEX "DictionaryWord_wordId_idx" ON "DictionaryWord"("wordId");

-- CreateIndex
CREATE INDEX "UserDictionary_addedAt_idx" ON "UserDictionary"("addedAt");

-- CreateIndex
CREATE INDEX "UserWord_userId_nextDueAt_idx" ON "UserWord"("userId", "nextDueAt");

-- CreateIndex
CREATE INDEX "UserWord_status_idx" ON "UserWord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_words_user_id_word_id_key" ON "UserWord"("userId", "wordId");

-- CreateIndex
CREATE INDEX "UserWordEvent_userId_createdAt_idx" ON "UserWordEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserWordEvent_userWordId_idx" ON "UserWordEvent"("userWordId");

-- AddForeignKey
ALTER TABLE "WordSense" ADD CONSTRAINT "WordSense_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordTag" ADD CONSTRAINT "WordTag_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordTag" ADD CONSTRAINT "WordTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictionaryWord" ADD CONSTRAINT "DictionaryWord_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES "Dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictionaryWord" ADD CONSTRAINT "DictionaryWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDictionary" ADD CONSTRAINT "UserDictionary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDictionary" ADD CONSTRAINT "UserDictionary_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES "Dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWord" ADD CONSTRAINT "UserWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWord" ADD CONSTRAINT "UserWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordEvent" ADD CONSTRAINT "UserWordEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordEvent" ADD CONSTRAINT "UserWordEvent_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordEvent" ADD CONSTRAINT "UserWordEvent_userWordId_fkey" FOREIGN KEY ("userWordId") REFERENCES "UserWord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
