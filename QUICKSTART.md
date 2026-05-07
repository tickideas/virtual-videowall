# Quick Start

Get the app running locally with PostgreSQL, Redis, and Daily.co credentials.

## Prerequisites

- Node.js 20+
- Docker or a local PostgreSQL 16 database
- Daily.co account and API key

## Automated Setup

```bash
./scripts/setup.sh
docker compose up -d postgres redis
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000.

Default admin:

- Email: `admin@example.com`
- Password: `admin123`

## Manual Setup

1. Install dependencies.

```bash
npm install
```

2. Create environment file.

```bash
cp .env.example .env
openssl rand -base64 32
```

Put the generated value in `NEXTAUTH_SECRET`, then add your Daily.co values:

```env
DAILY_API_KEY="your-daily-api-key"
DAILY_DOMAIN="your-daily-subdomain"
NEXT_PUBLIC_DAILY_DOMAIN="your-daily-subdomain"
```

3. Start local services.

```bash
docker compose up -d postgres redis
```

4. Prepare the database.

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start development.

```bash
npm run dev
```

## First Test Flow

1. Go to http://localhost:3000/admin and log in.
2. Create or activate a service and copy the session code.
3. Open http://localhost:3000/church, enter the session code and a church name, then allow camera access.
4. Click "Go Live".
5. Open http://localhost:3000/wall, enter the same session code, and confirm the church appears on the wall.

## Common Issues

### Database Connection Error

```bash
docker compose ps
docker compose restart postgres
docker logs videowall-postgres
```

Confirm `DATABASE_URL` points to `localhost:5432` for local commands, or `postgres:5432` from inside Docker Compose.

### Daily.co Token or Room Error

- Confirm `DAILY_API_KEY` is set.
- Confirm `DAILY_DOMAIN` and `NEXT_PUBLIC_DAILY_DOMAIN` are Daily subdomains, not full URLs.
- Confirm the Daily.co account can create rooms.

### Camera Not Working

- Use `localhost` or HTTPS; browsers require a secure context for camera access.
- Check browser camera permissions.
- Close other apps using the camera.
- Test Chrome or Safari if the issue is browser-specific.

## Useful Commands

```bash
npm run lint
npm run test
npm run build
npm run db:studio
docker compose logs -f
docker compose down
```

## Production

Use [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for Dokploy, Coolify, or Docker deployment.
