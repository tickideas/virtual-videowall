# Deployment

This guide covers production deployment for the Daily.co-based Virtual Video Wall. The app no longer deploys or manages a LiveKit server.

Dokploy is the recommended deployment target for this project. The previous Coolify deployment shape maps cleanly to Dokploy because the app already has a production `Dockerfile` and only needs PostgreSQL, Redis, and environment variables at runtime.

## Services

Production needs:

- Next.js app container
- PostgreSQL 16
- Redis 7, recommended for shared rate limits
- Daily.co account for video rooms and meeting tokens

## Dokploy Deployment

### 1. Create the Project

1. In Dokploy, create a project for Virtual Video Wall.
2. Add a PostgreSQL database service.
3. Add a Redis database service.
4. Add an application from this repository.
5. Set the application build type to `Dockerfile`.
6. Use `Dockerfile` for the Dockerfile path and `.` for the Docker context path.

The Docker image runs `npx prisma generate` during build. At container start, an entrypoint script syncs the database schema (`prisma migrate deploy` if a `prisma/migrations` directory exists, otherwise `prisma db push`) and then starts the standalone Next.js server with `node server.js`. No manual migration step is required on deploy.

### 2. Configure the Application

Set the app's internal port to `3000`.

When configuring a domain in Dokploy, route the domain to the app service on port `3000`. Do not publish PostgreSQL or Redis publicly unless you have a specific operational reason; they should stay private on Dokploy's internal network.

Attach the production domain, for example:

```text
videowall.yourdomain.com -> app:3000
```

Enable SSL for the domain. Camera access requires HTTPS outside of localhost.

## Required Environment Variables

Set these on the Dokploy application service as runtime environment variables. Do not pass secrets such as `DATABASE_URL`, `NEXTAUTH_SECRET`, or `DAILY_API_KEY` as Docker build arguments.

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

Use the internal PostgreSQL and Redis hostnames shown by Dokploy. If you created managed Dokploy database services, the host is usually the service name on the private network. If Redis has a password, include it in `REDIS_URL`, for example:

```env
REDIS_URL="redis://:password@redis-hostname:6379/0"
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 3. Deploy

Deploy the application from Dokploy.

If the build succeeds but the domain returns a bad gateway:

- Confirm the app listens on `0.0.0.0`; the provided `Dockerfile` sets `HOSTNAME=0.0.0.0`.
- Confirm Dokploy routes the domain to service port `3000`.
- Check that `DATABASE_URL` points to the internal PostgreSQL hostname, not `localhost`.
- Check app logs for Prisma connection errors.

### 4. Initialize the Database

Schema sync runs automatically on every container start, so PostgreSQL only needs to be reachable when the app boots.

To seed the initial admin user (from `ADMIN_EMAIL` / `ADMIN_PASSWORD`) and sample churches on the next start, set:

```env
RUN_SEED_ON_START=true
```

The seed script is idempotent — it skips records that already exist — but you can remove the variable after the first successful boot.

To run the seed manually instead, exec into the running app container:

```bash
node prisma/seed.mjs
```

## Migrating from Coolify to Dokploy

1. Back up the Coolify PostgreSQL database.
2. Create PostgreSQL and Redis services in Dokploy.
3. Restore the PostgreSQL backup into the Dokploy database.
4. Create the Dokploy app from the repository using the root `Dockerfile`.
5. Copy the production environment variables from Coolify to Dokploy, updating hostnames for `DATABASE_URL`, `REDIS_URL`, and the public URL in `NEXTAUTH_URL`.
6. Deploy the app and run the smoke test below.

Keep the existing Daily.co values unless you are rotating credentials. If you do rotate the Daily.co API key, update only server-side `DAILY_API_KEY`; `DAILY_DOMAIN` and `NEXT_PUBLIC_DAILY_DOMAIN` should remain the Daily subdomain.

## Coolify Deployment

Coolify remains supported as a fallback:

1. Create a PostgreSQL database.
2. Create a Redis service.
3. Create an application from the repository using the root `Dockerfile`.
4. Set the environment variables above.
5. Expose app port `3000`.
6. Attach a domain such as `videowall.yourdomain.com` and enable SSL.
7. Deploy.

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

When deploying this compose file through Dokploy's Docker Compose mode, reference variables explicitly in `docker-compose.yml` or use an `env_file`. Dokploy writes UI-defined compose variables to a `.env` file, but those variables are not automatically injected into containers unless the compose file references them.

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
- `3000/tcp` as the app's internal container port
- `5432/tcp` for PostgreSQL only if externally exposed
- `6379/tcp` for Redis only if externally exposed

Daily.co handles WebRTC infrastructure. No application-hosted WebRTC UDP port range is required.

## Operations

Useful checks:

```bash
docker logs videowall-app -f
docker logs videowall-postgres -f
docker logs videowall-redis -f
npm run db:studio
```

In Dokploy, prefer the built-in logs, metrics, database backups, and redeploy controls for day-to-day operations.

Recommended production controls:

- Enable automated PostgreSQL backups.
- Keep Redis private to the app network.
- Rotate Daily.co API keys if exposed.
- Change the seeded admin password immediately.
- Use HTTPS for camera access outside localhost.
