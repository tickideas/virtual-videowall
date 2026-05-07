# Deployment

This guide covers the current Daily.co-based deployment. The app no longer deploys or manages a LiveKit server.

## Services

Production needs:

- Next.js app container
- PostgreSQL 16
- Redis 7, recommended for shared rate limits
- Daily.co account for video rooms and meeting tokens

## Required Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:5432/videowall?schema=public"
REDIS_URL="redis://redis-hostname:6379"
NEXTAUTH_URL="https://videowall.yourdomain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="strong-initial-password"
DAILY_API_KEY="your-daily-api-key"
DAILY_DOMAIN="your-daily-subdomain"
NEXT_PUBLIC_DAILY_DOMAIN="your-daily-subdomain"
NEXT_PUBLIC_APP_NAME="Virtual Video Wall"
NEXT_PUBLIC_MAX_CHURCHES=60
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

## Coolify Deployment

1. Create a PostgreSQL database.
2. Create a Redis service.
3. Create an application from the repository using the root `Dockerfile`.
4. Set the environment variables above.
5. Expose app port `3000`.
6. Attach a domain such as `videowall.yourdomain.com` and enable SSL.
7. Deploy.

The Docker image runs `npx prisma generate` during build and starts the standalone Next.js server with `node server.js`.

## Docker Compose

For a single-host deployment, the included compose file starts PostgreSQL, Redis, and the app:

```bash
docker compose up -d
```

Before using it in production, provide real values for:

- `POSTGRES_PASSWORD`
- `NEXTAUTH_SECRET`
- `DAILY_API_KEY`
- `DAILY_DOMAIN`
- `NEXT_PUBLIC_DAILY_DOMAIN`

## Database Initialization

Run this once after PostgreSQL is available:

```bash
npm run db:push
npm run db:seed
```

Inside the production container, use:

```bash
npx prisma db push
node prisma/seed.mjs
```

The seed script creates the initial admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` when provided.

## Smoke Test

1. Visit the app domain.
2. Log in at `/admin`.
3. Create or activate a service and copy its session code.
4. Join from `/church` using the session code and a church name.
5. Open `/wall`, enter the same session code, and verify the church appears.
6. Confirm audio is muted and wall pagination stays at 20 tiles max.

## Ports

Only standard web/database/cache ports are required:

- `80/tcp` and `443/tcp` for the public app
- `5432/tcp` for PostgreSQL if externally exposed
- `6379/tcp` for Redis if externally exposed

Daily.co handles WebRTC infrastructure. No application-hosted WebRTC UDP port range is required.

## Operations

Useful checks:

```bash
docker logs videowall-app -f
docker logs videowall-postgres -f
docker logs videowall-redis -f
npm run db:studio
```

Recommended production controls:

- Enable automated PostgreSQL backups.
- Keep Redis private to the app network.
- Rotate Daily.co API keys if exposed.
- Change the seeded admin password immediately.
- Use HTTPS for camera access outside localhost.
