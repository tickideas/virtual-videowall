# Virtual Video Wall

A low-bandwidth virtual video wall for connecting 50-60 churches during zonal meetings. The app uses Next.js 16, React 19.2, Prisma, PostgreSQL, Redis-backed rate limiting, and Daily.co video rooms.

[Quick Start](./QUICKSTART.md) | [Technical Spec](./SPEC.md) | [Deployment](./docs/DEPLOYMENT.md) | [Contributing](./CONTRIBUTING.md) | [Agent Guide](./AGENTS.md)

## What It Does

- Church join flow with session code, church name, camera preview, and "Go Live"
- Daily.co video publishing optimized for 240x180 at 8 fps
- Wall display with a 20-tile maximum per page and pagination
- Admin portal for services, churches, dashboard stats, and session monitoring
- PWA support, connection health reporting, analytics events, and friendly rate limits
- Optional Redis rate limiting for multi-instance deployments

## Tech Stack

- Next.js 16 App Router
- React 19.2
- TypeScript 5.9
- Tailwind CSS
- Prisma 6 with PostgreSQL
- Daily.co via `@daily-co/daily-js`
- Redis via `ioredis` for shared rate limits
- Vitest for unit tests

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000.

Default seeded admin:

- Email: `admin@example.com`
- Password: `admin123`

Change the admin password before production use.

## Required Environment

```env
DATABASE_URL="postgresql://videowall:changeme@localhost:5432/videowall?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-this-password"
DAILY_API_KEY="your-daily-api-key"
DAILY_DOMAIN="your-domain"
NEXT_PUBLIC_DAILY_DOMAIN="your-domain"
NEXT_PUBLIC_APP_NAME="Virtual Video Wall"
NEXT_PUBLIC_MAX_CHURCHES=60
```

`DAILY_DOMAIN` is the Daily subdomain only, for example `my-team`, not a full URL.

## Core Commands

```bash
npm run dev            # Start local Next.js server
npm run build          # Production build
npm run start          # Start production server
npm run lint           # ESLint
npm run test           # Vitest
npm run test:coverage  # Coverage report
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema in development
npm run db:seed        # Seed admin/test data
npm run db:studio      # Open Prisma Studio
```

## Runtime Layout

```text
app/              Next.js pages and API routes
components/       UI, church, and wall components
lib/              Prisma, Daily.co, auth, analytics, rate limiting, helpers
prisma/           Database schema and seed script
public/           PWA assets and service worker
docs/             Deployment guide
```

## Bandwidth Rules

- Church video must remain 240x180 at 8 fps unless explicitly approved.
- Wall display must never render more than 20 live tiles per page.
- Audio must stay disabled by default.
- Daily.co secrets must stay server-side. Only `NEXT_PUBLIC_DAILY_DOMAIN` is client-visible.

## Documentation

The canonical docs are intentionally small:

- [QUICKSTART.md](./QUICKSTART.md) for local setup
- [SPEC.md](./SPEC.md) for architecture and constraints
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production deployment
- [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow
- [AGENTS.md](./AGENTS.md) for coding-agent instructions
