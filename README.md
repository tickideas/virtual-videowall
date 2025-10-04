# Virtual Video Wall

A low-bandwidth optimized virtual video wall platform for connecting 50-60 churches during zonal meetings. Built with Next.js 15, LiveKit, and optimized for 300-500 Kbps connections.

**🚀 [Quick Start →](./QUICKSTART.md)** | **📖 [Full Spec →](./SPEC.md)** | **🚢 [Deployment →](./DEPLOYMENT.md)** | **🤖 [Agent Guide →](./AGENTS.md)**

## Features

- **Church Interface**: Simple join flow with camera preview
- **Paginated Wall Display**: 4x5 grid showing 20 churches per page
- **Admin Portal**: Manage services, churches, and sessions
- **Low Bandwidth**: Optimized for 300-400 Kbps per church
- **Self-Hosted**: Deploy on Coolify with full control

## Tech Stack

- **Frontend/Backend**: Next.js 15 + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **WebRTC**: LiveKit (self-hosted)
- **Styling**: Tailwind CSS
- **Deployment**: Coolify / Docker

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- LiveKit Server (Docker)

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Setup environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database**:
```bash
npm run db:push
npm run db:seed
```

4. **Run development server**:
```bash
npm run dev
```

Visit http://localhost:3000

### Running with Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- LiveKit Server on ports 7880, 7881, 50000-60000
- Next.js app on port 3000

## Default Admin Credentials

- **Email**: admin@example.com
- **Password**: admin123

**⚠️ Change these after first login!**

## Usage

### 1. Admin Setup

1. Login to `/admin`
2. Add churches (generates unique codes)
3. Create a service (generates session code)
4. Share session code with churches

### 2. Church Connection

1. Visit `/church`
2. Enter session code + church code
3. Allow camera access
4. Click "Go Live"

### 3. Wall Display

1. Visit `/wall`
2. Enter session code
3. View paginated grid (20 per page)
4. Use navigation buttons or auto-advance

## Bandwidth Optimization

- **Church upload**: 240x180 @ 8fps = 300-400 Kbps
- **Wall download**: 20 streams = 6-8 Mbps
- **Audio**: Disabled by default (muted)
- **Simulcast**: Lowest quality layer only

## Deployment to Coolify

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Project Structure

```
/app
  /church          - Church interface
  /wall            - Video wall display
  /admin           - Admin portal
  /api             - API routes
/components
  /ui              - Reusable UI components
  /church          - Church-specific components
  /wall            - Wall display components
/lib
  prisma.ts        - Database client
  livekit.ts       - LiveKit utilities
  utils.ts         - Helper functions
/prisma
  schema.prisma    - Database schema
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/videowall
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with admin user

## Support

For issues or questions, see [SPEC.md](./SPEC.md) for technical details.

## License

Proprietary - For church use only