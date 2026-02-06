# BlinkVocab Server

Backend server for BlinkVocab Chrome Extension, built with Next.js and Prisma.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Setup

Copy `.env.example` to `.env.local` and configure your database:

```bash
cp .env.example .env.local
```

Run database migrations:

```bash
pnpm db:migrate
```

## API Routes

API endpoints are located in `src/app/api/`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
