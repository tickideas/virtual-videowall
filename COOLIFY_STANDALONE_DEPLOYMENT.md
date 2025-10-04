# Coolify Standalone Services Deployment Guide

This guide covers deploying the Virtual Video Wall on Coolify using **separate standalone services**:
1. PostgreSQL database (standalone service)
2. LiveKit server (standalone service using docker-compose.livekit.yml)
3. Main application (standalone application using Dockerfile)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Coolify Server                        │
├──────────────────┬──────────────────┬──────────────────────┤
│  PostgreSQL      │  LiveKit Server  │  Main Application    │
│  (Service 1)     │  (Service 2)     │  (Service 3)         │
│                  │                  │                      │
│  Port: 5432      │  Ports:          │  Port: 3000          │
│  Internal        │  7880 (WS)       │  Public HTTPS        │
│                  │  7881 (TCP)      │                      │
│                  │  51000-51100/udp │                      │
│                  │  Public HTTPS    │                      │
└──────────────────┴──────────────────┴──────────────────────┘
                            │
                            ▼
                    Internet Users
              (Churches & Wall Display)
```

## Prerequisites

- Coolify instance with public IP
- Domain with DNS configured:
  - `videowall.yourdomain.com` → Main app
  - `livekit.yourdomain.com` → LiveKit server
  - (Optional) `db.yourdomain.com` → PostgreSQL (if exposed)
- SSL certificates (Coolify handles via Let's Encrypt)

---

## Part 1: Deploy PostgreSQL Database

### Step 1.1: Create PostgreSQL Service

1. In Coolify, click **+ New Resource**
2. Select **Database** → **PostgreSQL**
3. Configure:
   - **Name**: `videowall-postgres`
   - **Database Name**: `videowall`
   - **Username**: `videowall_user`
   - **Password**: *Generate a strong password*
   - **Port**: `5432` (default)

4. **Network**:
   - ✅ Keep on default network (for internal access)
   - ⚠️ **Do NOT expose publicly** unless required

5. Click **Deploy**

### Step 1.2: Get Database Connection URL

After deployment, note the internal connection URL:
```
postgresql://videowall_user:your-password@container-name:5432/videowall
```

Or if using Coolify's internal DNS:
```
postgresql://videowall_user:your-password@videowall-postgres:5432/videowall
```

**Save this URL** - you'll need it for the main application.

---

## Part 2: Deploy LiveKit Server

### Step 2.1: Generate LiveKit Keys

**IMPORTANT**: Generate unique keys for production!

```bash
# Generate API Key (must start with LK)
echo "LK$(openssl rand -hex 16)"
# Example output: LK3f2a8b9c4d5e6f7a8b9c0d1e2f3a4b5

# Generate API Secret
openssl rand -base64 32
# Example output: X9kL2mN3oP4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4k=
```

**Save these keys** - you'll use them for both LiveKit and the main app.

### Step 2.2: Create LiveKit Service

1. In Coolify, click **+ New Resource**
2. Select **Service** → **Docker Compose**
3. Configure:
   - **Name**: `videowall-livekit`
   - **Repository**: `https://github.com/tickideas/virtual-videowall.git`
   - **Branch**: `main`
   - **Docker Compose File**: `docker-compose.livekit.yml`

### Step 2.3: Configure Environment Variables

Add these environment variables in Coolify:

```bash
LIVEKIT_API_KEY=LK3f2a8b9c4d5e6f7a8b9c0d1e2f3a4b5
LIVEKIT_API_SECRET=X9kL2mN3oP4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4k=
```

### Step 2.4: Configure Ports

**Critical**: These ports must be exposed:

| Port | Protocol | Purpose | Exposure |
|------|----------|---------|----------|
| 7880 | TCP | WebSocket/HTTP | Public (via proxy or direct) |
| 7881 | TCP | TCP fallback | Public (if needed) |
| 51000-51100 | UDP | RTC Media | **MUST be public, direct** |

**Important Notes:**
- UDP ports **cannot** be proxied - must be directly accessible
- Port 7880 can be proxied with WebSocket support
- Configure firewall to allow these ports

### Step 2.5: Configure Domain

Set up domain for LiveKit:
- **Domain**: `livekit.yourdomain.com`
- **Port**: `7880`
- **SSL**: Enable (Let's Encrypt)
- **WebSocket Support**: ✅ Enable

### Step 2.6: Deploy

Click **Deploy** and monitor logs. Should see:
```
✅ Starting LiveKit server...
✅ Listening on port 7880
```

### Step 2.7: Verify LiveKit

Test the connection:
```bash
# From your local machine
curl https://livekit.yourdomain.com
# Should return: OK

# Test WebSocket (install wscat: npm i -g wscat)
wscat -c wss://livekit.yourdomain.com
# Should connect successfully
```

---

## Part 3: Deploy Main Application

### Step 3.1: Create Application Service

1. In Coolify, click **+ New Resource**
2. Select **Application** → **Docker**
3. Configure:
   - **Name**: `videowall-app`
   - **Repository**: `https://github.com/tickideas/virtual-videowall.git`
   - **Branch**: `main`
   - **Build Pack**: Docker
   - **Dockerfile**: `Dockerfile` (default)

### Step 3.2: Configure Environment Variables

Add ALL these environment variables:

```bash
# Database (use the URL from Part 1)
DATABASE_URL=postgresql://videowall_user:your-password@videowall-postgres:5432/videowall?schema=public

# NextAuth
NEXTAUTH_URL=https://videowall.yourdomain.com
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>

# Admin credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>

# LiveKit Server-side (use PUBLIC URL for standalone services)
LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=LK3f2a8b9c4d5e6f7a8b9c0d1e2f3a4b5
LIVEKIT_API_SECRET=X9kL2mN3oP4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4k=

# LiveKit Client-side (MUST be publicly accessible)
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com

# App Settings
NEXT_PUBLIC_APP_NAME=Virtual Video Wall
NEXT_PUBLIC_MAX_CHURCHES=60
```

**Critical Points:**
- ✅ `LIVEKIT_URL` and `NEXT_PUBLIC_LIVEKIT_URL` **MUST be the same** for standalone services
- ✅ Both must use `wss://` (secure WebSocket) for HTTPS sites
- ✅ `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` must match LiveKit service exactly
- ✅ `DATABASE_URL` must use the internal PostgreSQL hostname

### Step 3.3: Configure Domain

- **Domain**: `videowall.yourdomain.com`
- **Port**: `3000`
- **SSL**: Enable (Let's Encrypt)

### Step 3.4: Deploy

Click **Deploy** and monitor build logs.

### Step 3.5: Initialize Database

After the application is running, you need to initialize the database:

**Option A: Via Coolify Terminal**
1. Go to your application in Coolify
2. Open **Terminal**
3. Run:
```bash
npx prisma db push
npx prisma db seed
```

**Option B: Via SSH to Coolify Server**
```bash
# SSH to Coolify server
ssh your-server

# Find container ID
docker ps | grep videowall-app

# Execute commands
docker exec -it <container-id> npx prisma db push
docker exec -it <container-id> npx prisma db seed
```

---

## Part 4: Verification & Testing

### 4.1: Check All Services

```bash
# Check PostgreSQL
docker ps | grep postgres
# Should show: Up and running

# Check LiveKit
curl https://livekit.yourdomain.com
# Should return: OK

# Check Main App
curl https://videowall.yourdomain.com
# Should return: HTML page
```

### 4.2: Test Database Connection

Visit: `https://videowall.yourdomain.com/api/health` (if you have a health endpoint)

Or check application logs for database connection messages.

### 4.3: Test Admin Login

1. Visit: `https://videowall.yourdomain.com/admin`
2. Login with your `ADMIN_EMAIL` and `ADMIN_PASSWORD`
3. Should see the admin dashboard

### 4.4: Test Church Creation

1. In admin dashboard, create a new church
2. Should get a 6-digit code
3. Note this code for next test

### 4.5: Test Service Creation

1. In admin dashboard, create a new service
2. Should get a session code
3. Copy the "Open Wall" link

### 4.6: Test Church Interface

1. Visit: `https://videowall.yourdomain.com/church`
2. Enter the session code
3. Allow camera access
4. Should see video preview
5. Click "Go Live"
6. Should connect successfully

### 4.7: Test Wall Display

1. Open the "Open Wall" link from step 4.5
2. Should see the video wall grid
3. Should show the church you just connected
4. Video should be playing

---

## Part 5: Troubleshooting

### Issue: "Failed to connect to database"

**Check:**
```bash
# Verify DATABASE_URL is correct
docker exec <app-container> env | grep DATABASE_URL

# Test connection from app container to PostgreSQL
docker exec <app-container> nc -zv videowall-postgres 5432
```

**Fix:**
- Ensure PostgreSQL service is running
- Verify DATABASE_URL hostname matches PostgreSQL service name
- Check password is correct (no special chars that need escaping)
- Ensure both services are on the same network in Coolify

### Issue: "one of key-file or keys must be provided" (LiveKit)

**Check:**
```bash
# Verify environment variables are set
docker exec <livekit-container> env | grep LIVEKIT

# Check generated config
docker exec <livekit-container> cat /livekit.yaml
```

**Fix:**
- Ensure `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set in Coolify
- Redeploy the LiveKit service
- Check for typos in variable names

### Issue: "Failed to generate token" or "Invalid token"

**Check:**
```bash
# Verify keys match in both services
docker exec <livekit-container> env | grep LIVEKIT_API_KEY
docker exec <app-container> env | grep LIVEKIT_API_KEY
```

**Fix:**
- Keys must be **exactly the same** in LiveKit and main app
- No extra whitespace or quotes
- Redeploy both services after changing keys

### Issue: "WebSocket connection failed"

**Check:**
```bash
# Test WebSocket from your local machine
wscat -c wss://livekit.yourdomain.com

# Check if port 7880 is accessible
nc -zv livekit.yourdomain.com 7880
```

**Fix:**
- Ensure port 7880 is exposed in Coolify
- Verify domain DNS is correct
- Check SSL certificate is valid
- Ensure reverse proxy supports WebSocket upgrades

### Issue: "ICE connection failed" or "No video"

**Check:**
```bash
# Test UDP ports
nc -u -zv livekit.yourdomain.com 51000
```

**Fix:**
- **UDP ports 51000-51100 MUST be directly accessible**
- Configure firewall: `ufw allow 51000:51100/udp`
- Cannot proxy UDP - must be direct connection
- Check if ISP blocks UDP traffic

### Issue: Cameras work in testing but not on wall

**Possible causes:**
- Bandwidth too low (need 300-500 Kbps per church)
- Network restrictions on church side
- Firewall blocking UDP ports
- Browser permissions not granted

**Fix:**
- Test bandwidth: https://fast.com
- Check browser console for errors
- Try different network (mobile hotspot)
- Ensure HTTPS (cameras require secure context)

---

## Part 6: Production Checklist

Before going live:

### Security
- [ ] Changed default LiveKit keys (generated unique keys)
- [ ] Changed default admin password (strong password)
- [ ] Changed NEXTAUTH_SECRET (generated unique secret)
- [ ] PostgreSQL not exposed publicly (internal only)
- [ ] All environment variables properly set
- [ ] No `.env` files committed to repository
- [ ] Firewall configured (only required ports open)
- [ ] SSL certificates installed and valid (HTTPS everywhere)

### Performance
- [ ] Database indexed (check `prisma/schema.prisma`)
- [ ] Video quality set to 240x180 @ 8fps (check `livekit.yaml`)
- [ ] Wall pagination at 20 per page (check `WallDisplay` component)
- [ ] Server has adequate resources (4+ cores, 8GB RAM)
- [ ] Network bandwidth sufficient (50+ Mbps upload)

### Functionality
- [ ] Admin login works
- [ ] Can create churches
- [ ] Can create services
- [ ] Church interface connects
- [ ] Camera works (desktop & mobile)
- [ ] Video shows on wall
- [ ] Pagination works
- [ ] Multiple churches can connect simultaneously
- [ ] Session codes work correctly

### Monitoring
- [ ] Set up log monitoring (Coolify or external)
- [ ] Set up uptime monitoring
- [ ] Set up alerts for service failures
- [ ] Document backup procedures
- [ ] Document rollback procedures

---

## Part 7: Environment Variables Reference

### Complete List for Each Service

#### LiveKit Service
```bash
LIVEKIT_API_KEY=<your-unique-key>
LIVEKIT_API_SECRET=<your-unique-secret>
```

#### Main Application
```bash
# Database
DATABASE_URL=postgresql://user:password@postgres-hostname:5432/videowall?schema=public

# NextAuth
NEXTAUTH_URL=https://videowall.yourdomain.com
NEXTAUTH_SECRET=<generate-unique>

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>

# LiveKit (use same keys as LiveKit service)
LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=<your-unique-key>
LIVEKIT_API_SECRET=<your-unique-secret>
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com

# App Settings
NEXT_PUBLIC_APP_NAME=Virtual Video Wall
NEXT_PUBLIC_MAX_CHURCHES=60
```

---

## Part 8: Maintenance

### Updating the Application

```bash
# In Coolify, just trigger a redeploy
# It will pull latest code from your GitHub repo
```

### Database Backups

```bash
# Manual backup
docker exec <postgres-container> pg_dump -U videowall_user videowall > backup.sql

# Restore
cat backup.sql | docker exec -i <postgres-container> psql -U videowall_user videowall
```

### Viewing Logs

In Coolify:
1. Go to service
2. Click **Logs**
3. View real-time logs

Or via SSH:
```bash
docker logs -f <container-name>
```

### Restarting Services

In Coolify:
1. Go to service
2. Click **Restart**

Or via SSH:
```bash
docker restart <container-name>
```

---

## Support Resources

- **Project Documentation**: See `SPEC.md`, `DEPLOYMENT.md`, `AGENTS.md`
- **Quick Start**: See `QUICKSTART.md`
- **GitHub Issues**: https://github.com/tickideas/virtual-videowall/issues
- **Coolify Docs**: https://coolify.io/docs

---

## Quick Reference: Common Commands

```bash
# View all running containers
docker ps

# Check service logs
docker logs <container-name>

# Execute command in container
docker exec <container-name> <command>

# Restart service
docker restart <container-name>

# Check environment variables
docker exec <container-name> env

# Database migrations
docker exec <app-container> npx prisma db push
docker exec <app-container> npx prisma db seed

# Test connections
curl https://livekit.yourdomain.com  # Should return: OK
curl https://videowall.yourdomain.com  # Should return: HTML
wscat -c wss://livekit.yourdomain.com  # Should connect
```

---

**Remember**: This platform serves churches with limited bandwidth. Every decision should prioritize reliability and low bandwidth usage over feature richness.
