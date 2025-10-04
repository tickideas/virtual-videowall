# Quick Start Guide

Get your Virtual Video Wall running in 5 minutes!

## Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./scripts/setup.sh

# Start Docker services
docker-compose up -d

# Start development server
npm run dev
```

Visit http://localhost:3000

**Default login:**
- Email: `admin@example.com`
- Password: `admin123`

## Option 2: Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` and generate secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate LiveKit keys
openssl rand -hex 16  # API Key
openssl rand -base64 32  # API Secret
```

### 3. Start Services

```bash
# PostgreSQL + LiveKit
docker-compose up -d
```

### 4. Setup Database

```bash
# Push schema
npm run db:push

# Seed with admin user
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

## First Steps After Installation

### 1. Login to Admin

1. Go to http://localhost:3000/admin
2. Login with:
   - Email: `admin@example.com`
   - Password: `admin123`
3. **Change password immediately!**

### 2. Add Churches

1. Go to "Manage Churches"
2. Click "Add Church"
3. Enter church name and location
4. System generates unique 6-digit code
5. Share code with church

### 3. Create a Service

1. Go to "Manage Services"
2. Click "Create Service"
3. Enter service name and date/time
4. System generates session code
5. Share session code with all churches

### 4. Test Church Connection

1. Open http://localhost:3000/church
2. Enter session code
3. Enter church code
4. Allow camera access
5. Click "Go Live"

### 5. View Video Wall

1. Open http://localhost:3000/wall
2. Enter session code
3. See connected churches in grid
4. Use navigation to view all pages

## Common Issues

### Port Already in Use

If ports 3000, 5432, or 7880 are in use:

```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker logs videowall-postgres
```

### LiveKit Connection Failed

```bash
# Check LiveKit is running
docker ps

# Test LiveKit endpoint
curl http://localhost:7880/

# Check logs
docker logs videowall-livekit
```

### Camera Not Working

- Ensure HTTPS or localhost (browsers require secure context)
- Check browser permissions
- Try different browser (Chrome recommended)
- Check camera is not used by another app

## Next Steps

### For Development

- Read [CONTRIBUTING.md](./CONTRIBUTING.md)
- Check [SPEC.md](./SPEC.md) for technical details
- Use `npm run db:studio` to view database

### For Production

- Read [DEPLOYMENT.md](./DEPLOYMENT.md)
- Deploy to Coolify or your server
- Setup domain with SSL
- Configure firewall rules
- Enable backups

## Architecture Overview

```
┌─────────────────┐
│   Churches      │
│  (60 clients)   │
│  Upload: 300Kb  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LiveKit SFU    │
│  (Port 7880)    │
│  Distribute     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Video Wall    │
│  (1-2 viewers)  │
│  Download: 7Mb  │
└─────────────────┘

┌─────────────────┐
│   Next.js App   │
│  (Port 3000)    │
│  API + Pages    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  (Port 5432)    │
│  Churches, Svc  │
└─────────────────┘
```

## Key Features

✅ **Low Bandwidth**: 300-400 Kbps per church
✅ **Scalable**: 50-60 simultaneous churches
✅ **Paginated Display**: 20 churches per page
✅ **Simple Join**: 6-digit codes, no accounts
✅ **Self-Hosted**: Full control on Coolify
✅ **Mobile Ready**: Works on phones/tablets

## Support

- **Documentation**: See README.md, SPEC.md
- **Issues**: Check existing issues first
- **Logs**: `docker logs <container-name>`

## Video Quality Settings

Current settings optimized for bandwidth:

- **Resolution**: 240x180 (QVGA)
- **Framerate**: 8 fps
- **Bitrate**: 250 Kbps
- **Audio**: Disabled

To change, edit `livekit.yaml` and adjust:
- `width` and `height`
- `bitrate`
- `framerate`

Higher quality = more bandwidth!

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:studio       # View database
npm run db:push         # Update schema

# Production
npm run build           # Build for production
npm run start           # Start production

# Database
npm run db:seed         # Seed database
npx prisma migrate dev  # Create migration

# Docker
docker-compose up -d    # Start services
docker-compose down     # Stop services
docker-compose logs -f  # View logs
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated unique API keys
- [ ] Setup HTTPS in production
- [ ] Enabled firewall
- [ ] Configured backups
- [ ] Limited SSH access

---

**Ready to go live?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup!
