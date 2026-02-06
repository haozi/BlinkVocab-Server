const { defineConfig } = require('prisma/config')
require('dotenv').config({ path: '.env.local' })

module.exports = defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || '',
    directUrl: process.env.DATABASE_DIRECT_URL,
  },
  seed: './prisma/seed.ts',
})
