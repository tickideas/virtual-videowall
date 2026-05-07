# Contributing

## Development Setup

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

The local app runs at http://localhost:3000.

## Project Structure

```text
app/
  admin/             Admin pages
  api/               Route handlers
    daily/           Daily.co token endpoint
    session/         Join, leave, and health endpoints
    service/         Public service lookup
    auth/            Admin login/logout
  church/            Church join and streaming page
  wall/              Wall entry and session wall pages
components/
  church/            Daily.co church broadcaster UI
  wall/              Daily.co wall display
  ui/                Reusable UI primitives
lib/
  daily.ts           Daily.co room/token helpers
  prisma.ts          Prisma client singleton
  rate-limit.ts      In-memory/Redis rate limiting
  redis.ts           Optional Redis client
  auth.ts            Cookie auth helpers
prisma/
  schema.prisma      Database schema
  seed.mjs           Seed data
```

## Code Standards

- Use TypeScript strict mode and avoid `any`.
- Use functional React components and hooks.
- Keep components focused; split large components when a clear boundary appears.
- Use Prisma for database access.
- Validate route input before mutating data.
- Use Tailwind CSS and existing UI primitives.
- Keep Daily.co API keys on the server. Do not expose secrets through `NEXT_PUBLIC_*`.

## Video Constraints

- Church video stays at 240x180 and 8 fps.
- Wall display stays paginated at 20 tiles max.
- Audio stays disabled by default.
- Do not create multiple Daily call instances in one component. Use refs and cleanup carefully.

## Testing

Run before opening a PR:

```bash
npm run lint
npm run test
npm run build
```

Manual checks for affected areas:

- Church join accepts valid session codes and rejects invalid ones.
- Camera preview appears before joining.
- Go Live connects and publishes video.
- Wall display shows a maximum of 20 churches per page.
- Pagination and fullscreen controls work.
- Admin login, service creation, and session-code copy work.
- Rate limit errors remain clear and church-friendly.

## Database Changes

1. Update `prisma/schema.prisma`.
2. Add indexes for frequently queried fields.
3. Run `npm run db:push` locally.
4. Update `prisma/seed.mjs` if default data changes.
5. Run `npm run db:generate`.

## Pull Requests

Include:

- What changed and why.
- How it was tested.
- Screenshots or video for UI changes.
- Database migration notes if the schema changed.
- Bandwidth impact notes for video-related changes.

Use conventional commits such as `feat:`, `fix:`, `docs:`, `refactor:`, and `perf:`.
