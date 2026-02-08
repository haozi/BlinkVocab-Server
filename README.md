# BlinkVocab Server

Backend API server for BlinkVocab Chrome Extension, built with Next.js, TypeScript, and Prisma ORM.

## Architecture

**Full-Stack Application**: This is a Next.js application with both API routes and Dashboard UI.

- **Framework**: Next.js 16 with App Router
- **Runtime**: Node.js (configured for all routes via `export const runtime = 'nodejs'`)
- **Database**: PostgreSQL with Prisma 7 ORM (@prisma/adapter-pg)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS 4
- **Middleware**: Authentication header extraction and request context enrichment

### Components

1. **API Routes** (`src/app/api/**`): RESTful API endpoints for Chrome extension and dashboard
2. **Dashboard UI** (`src/app/dashboard/**`): Web interface for vocabulary management

## Prerequisites

- **Node.js** 18+ and **pnpm** 9+
- **PostgreSQL** 13+ (running locally or via Docker)
- Environment variables configured (see [Environment Setup](#environment-setup))

## Local Setup

### 1. Install Dependencies

```bash
cd BlinkVocab-Server
pnpm install
```

### 2. Environment Configuration

Copy the example file and configure:

```bash
cp .env.example .env.local
```

**Environment Variables** (`.env.local`):

```env
# Database URL for Prisma migrations and client generation
# Format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blink_vocab

# Direct database URL (bypasses connection pooling)
# Used for pool configuration and migrations
DATABASE_DIRECT_URL=postgresql://postgres:postgres@localhost:5432/blink_vocab

# Prisma Client engine (binary or wasm)
PRISMA_CLIENT_ENGINE_TYPE=binary

# Node environment
NODE_ENV=development
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

Start PostgreSQL container:

```bash
docker run --name postgres_blink \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=blink_vocab \
  -p 5432:5432 \
  -d postgres:17-alpine
```

#### Option B: Using Local PostgreSQL

```bash
# Create database
createdb blink_vocab

# Or via psql
psql -U postgres -c "CREATE DATABASE blink_vocab;"
```

### 4. Run Migrations

Initialize the database schema:

```bash
pnpm db:migrate
```

This applies all pending Prisma migrations to your database.

### 5. Start Development Server

```bash
pnpm dev
```

The server will start at `http://localhost:3000`

### 6. Access Dashboard

Open your browser and navigate to:

```
http://localhost:3000/dashboard
```

The dashboard provides:
- **Overview**: Learning statistics and progress
- **Words**: Browse and manage your vocabulary
- **Market**: Dictionary marketplace (coming soon)

**Note**: For MVP, the dashboard uses a dev user. Social login (Google, etc.) will be implemented in a future update.

## API Endpoints

### Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Server health status check
- **Response**:
  ```json
  {
    "ok": true,
    "time": "2025-02-07T03:00:00.000Z",
    "userId": "user-123" // Optional, if x-user-id header provided
  }
  ```

### Testing the Health Endpoint

```bash
# Without authentication
curl http://localhost:3000/api/health

# With user ID header
curl -H "x-user-id: user-123" http://localhost:3000/api/health
```

## Authentication

The server includes middleware (`src/middleware.ts`) that:

1. **Reads** the `x-user-id` header from incoming requests
2. **Enriches** the request context with authenticated user information
3. **Provides** `x-authenticated-user-id` to route handlers

### Usage in Route Handlers

```typescript
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Get authenticated user ID from middleware
  const userId = request.headers.get('x-authenticated-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Handle authenticated request
  return NextResponse.json({ data: 'user-specific-data' })
}
```

## Project Structure

```
src/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── health/
│   │   │   └── route.ts       # Health check endpoint
│   │   ├── dashboard/
│   │   │   └── overview/      # Dashboard overview API
│   │   ├── words/             # Word management APIs
│   │   ├── tasks/             # Daily tasks API
│   │   ├── review/            # Review submission API
│   │   └── market/            # Dictionary marketplace API
│   ├── dashboard/             # Dashboard UI pages
│   │   ├── layout.tsx         # Dashboard layout with navigation
│   │   ├── page.tsx           # Dashboard entry (redirects to overview)
│   │   ├── overview/          # Overview page
│   │   ├── words/             # Words list and detail pages
│   │   └── market/            # Dictionary marketplace page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page (redirects to dashboard)
│   └── globals.css            # Global styles
├── middleware.ts               # Request authentication middleware
├── lib/
│   ├── prisma.ts              # PrismaClient singleton
│   └── utils.ts               # Utility functions
└── types/                     # TypeScript type definitions
    ├── dashboard.ts
    ├── words.ts
    └── review.ts

prisma/
├── schema.prisma              # Database schema
├── migrations/                # Migration history
└── seed.ts                    # Database seeding script
```

## Development Workflow

### Generate Prisma Client

After modifying `prisma/schema.prisma`:

```bash
pnpm db:generate
```

Or automatically run with migrations:

```bash
pnpm db:migrate
```

### View Database

Interactive SQL explorer:

```bash
pnpm db:studio
```

Opens Prisma Studio at `http://localhost:5555`

### Build for Production

```bash
pnpm build
```

Starts server:

```bash
pnpm start
```

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:studio` - Open Prisma Studio UI
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

## Troubleshooting

### Database Connection Issues

```bash
# Verify PostgreSQL is running
psql -U postgres -c "\l"

# Check connection string format
# Expected: postgresql://user:password@host:port/database

# Reset migrations (development only)
pnpm prisma migrate reset --force
```

### Port Already in Use

The server uses port 3000. To use a different port:

```bash
PORT=3001 pnpm dev
```

### Prisma Client Not Generated

```bash
# Regenerate Prisma Client
pnpm db:generate

# Clear cache and reinstall
rm -rf node_modules/.prisma
pnpm install
```

## Technology Stack

- **Next.js 16.1.6** - React framework with App Router
- **TypeScript 5.7** - Static type checking
- **Prisma 7.3.0** - ORM with PostgreSQL adapter
- **PostgreSQL 13+** - Relational database
- **Node.js Runtime** - Server-side execution

## Resources

- [Next.js Documentation](https://nextjs.org/docs) - Framework features and API
- [Prisma Documentation](https://www.prisma.io/docs) - ORM guide and CLI
- [TypeScript Handbook](https://www.typescriptlang.org/docs) - Language reference
- [PostgreSQL Documentation](https://www.postgresql.org/docs) - Database guide

## License

See LICENSE file for details.
