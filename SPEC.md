# Virtual Video Wall Technical Spec

## Overview

Virtual Video Wall connects 50-60 churches to a paginated video wall for zonal meetings. The product prioritizes low-bandwidth reliability over video quality or feature breadth.

## Architecture

- Next.js 16 App Router for pages and API routes
- React 19.2 client components for camera, Daily.co, and interactive wall views
- Prisma with PostgreSQL for churches, services, sessions, users, and analytics events
- Daily.co rooms and meeting tokens for video transport
- Redis-backed rate limiting when `REDIS_URL` is set, with in-memory fallback for local development
- Tailwind CSS for styling

## Core Flows

### Admin

1. Admin logs in at `/admin`.
2. Admin creates or activates a service.
3. App generates a session code.
4. Admin shares the session code with churches and the wall operator.

### Church

1. Church opens `/church`.
2. Church enters session code and church name.
3. `POST /api/session/join` validates the active service and finds or creates the church by name.
4. `POST /api/daily/token` creates or reuses a Daily.co room for the service and returns a token that can publish video.
5. Church publishes camera video with audio disabled.

### Wall

1. Operator opens `/wall`.
2. Operator enters a session code.
3. `POST /api/daily/token` returns a viewer token that can subscribe but not publish.
4. Wall subscribes to Daily.co participant tracks and renders 20 tiles max per page.

## API Routes

- `POST /api/auth/login` - admin login
- `POST /api/auth/logout` - admin logout
- `GET /api/admin/dashboard/stats` - dashboard stats
- `GET /api/admin/dashboard/stream` - server-sent dashboard updates
- `GET /api/admin/churches` - list churches
- `POST /api/admin/churches` - create church
- `GET /api/admin/services` - list services
- `POST /api/admin/services` - create service
- `POST /api/session/join` - create or resume church session
- `POST /api/session/leave` - mark session inactive
- `POST /api/session/health` - update connection health
- `GET /api/service/[sessionCode]` - fetch service by code
- `POST /api/daily/token` - create Daily.co room/token
- `POST /api/analytics` - record analytics event

## Database Models

- `Church`: name, generated code, optional location, sessions
- `Service`: name, unique session code, active window, max church count
- `Session`: church/service join state, bandwidth and health telemetry
- `User`: admin credentials and role
- `AnalyticsEvent`: event name, properties, session context, URL, user agent

Frequently queried fields are indexed in `prisma/schema.prisma`, including church code/name, service session code/active state, active sessions, health timestamps, analytics event, analytics session, and analytics created time.

## Daily.co Rules

- Use `lib/daily.ts` for room and token management.
- Use `app/api/daily/token/route.ts` for token issuance.
- Do not expose `DAILY_API_KEY` to the browser.
- `NEXT_PUBLIC_DAILY_DOMAIN` is safe because it contains only the Daily.co subdomain.
- Keep camera constraints aligned with `DAILY_VIDEO_SETTINGS`.
- Use refs and cleanup to avoid duplicate Daily call instances.

## Bandwidth Constraints

- Church upload target: 240x180 at 8 fps.
- Wall display: 20 streams maximum per page.
- Audio disabled by default.
- Avoid heavy client work during active video streaming.

## Rate Limits

- Auth: 10 attempts per 5 minutes.
- Session joins: 15 joins per 2 minutes.
- General API: 150 requests per minute.

When Redis is configured, limits are shared across app instances. Without Redis, limits are process-local.

## Testing

Required before production changes:

```bash
npm run lint
npm run test
npm run build
```

Manual testing should cover church join, Daily.co camera publishing, wall subscription, pagination, admin service creation, and invalid-code errors.
