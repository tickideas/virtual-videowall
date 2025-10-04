# Deployment Guide - Coolify

This guide walks you through deploying the Virtual Video Wall platform on Coolify.

## Prerequisites

- Coolify instance running (v4+)
- Domain name (optional but recommended)
- Server with 8GB RAM, 4 vCPUs minimum

## Step 1: Prepare Your Server

### Recommended Server Specs
- **Provider**: Hetzner, DigitalOcean, Vultr
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Location**: Closest to majority of churches

### Open Required Ports
```bash
# SSH
22/tcp

# HTTP/HTTPS
80/tcp
443/tcp

# LiveKit WebRTC
7880/tcp   # HTTP API
7881/tcp   # WebRTC TCP
50000-60000/udp  # WebRTC UDP range
```

## Step 2: Setup Coolify

1. Install Coolify on your server:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

2. Access Coolify at `http://your-server-ip:8000`

3. Complete initial setup and create admin account

## Step 3: Deploy PostgreSQL

1. In Coolify, go to **Databases** → **New Database**
2. Select **PostgreSQL 16**
3. Configure:
   - **Name**: videowall-db
   - **Username**: videowall
   - **Password**: (generate strong password)
   - **Database**: videowall
4. Click **Deploy**
5. Note the connection string

## Step 4: Deploy LiveKit Server

1. Go to **Applications** → **New Application**
2. Select **Docker Compose**
3. Name: `videowall-livekit`
4. Paste this docker-compose.yml:

```yaml
version: '3.9'

services:
  livekit:
    image: livekit/livekit-server:v1.5
    command: --config /livekit.yaml
    volumes:
      - ./livekit.yaml:/livekit.yaml:ro
    ports:
      - "7880:7880"
      - "7881:7881"
      - "50000-60000:50000-60000/udp"
    restart: unless-stopped
```

5. Create `livekit.yaml` file in the same directory:

```yaml
port: 7880
bind_addresses:
  - ""

rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  tcp_port: 7881

keys:
  # Generate with: openssl rand -base64 32
  APIKEY123: APISECRET456

room:
  max_participants: 65
  empty_timeout: 300
  auto_create: true

video:
  simulcast_layers:
    - quality: low
      width: 240
      height: 180
      bitrate: 250000
      framerate: 8
    - quality: medium
      width: 320
      height: 240
      bitrate: 350000
      framerate: 10

audio:
  enabled: false

logging:
  level: info
  json: true

turn:
  enabled: false
```

6. Generate API keys:
```bash
openssl rand -base64 32  # API Key
openssl rand -base64 32  # API Secret
```

7. Update `keys:` section in livekit.yaml
8. Click **Deploy**

## Step 5: Deploy Next.js Application

1. Go to **Applications** → **New Application**
2. Select **GitHub** or **Git Repository**
3. Connect your repository
4. Configure:
   - **Build Pack**: Node.js
   - **Branch**: main
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Port**: 3000

5. Set environment variables:

```env
# Database (from Step 3)
DATABASE_URL=postgresql://videowall:PASSWORD@postgres:5432/videowall

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# LiveKit (from Step 4)
LIVEKIT_URL=ws://your-server-ip:7880
LIVEKIT_API_KEY=APIKEY123
LIVEKIT_API_SECRET=APISECRET456

# Public (important for client-side)
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
```

6. Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

7. Click **Deploy**

## Step 6: Setup Domain & SSL

### For Next.js App

1. In Coolify, go to your app settings
2. **Domains** → Add domain: `videowall.yourdomain.com`
3. Enable **Generate SSL Certificate** (Let's Encrypt)
4. Point your DNS A record to server IP

### For LiveKit

1. Add another domain: `livekit.yourdomain.com`
2. Configure reverse proxy for port 7880
3. Enable SSL
4. Update `NEXT_PUBLIC_LIVEKIT_URL` to `wss://livekit.yourdomain.com`

### DNS Configuration

Add these A records:
```
videowall.yourdomain.com    → your-server-ip
livekit.yourdomain.com      → your-server-ip
```

## Step 7: Initialize Database

1. SSH into your server
2. Run migrations:

```bash
# Access the Next.js container
docker exec -it videowall-app bash

# Run Prisma migrations
npx prisma db push

# Seed the database
npx prisma db seed
```

## Step 8: Create Admin User

1. SSH into your server
2. Access PostgreSQL:

```bash
docker exec -it videowall-db psql -U videowall -d videowall
```

3. Create admin user:

```sql
INSERT INTO "User" (id, email, password, name, role)
VALUES (
  'admin-1',
  'admin@yourdomain.com',
  '$2a$10$YourHashedPasswordHere',  -- See below
  'Admin',
  'admin'
);
```

4. Generate hashed password:

```bash
# In Node.js REPL
node
> const bcrypt = require('bcryptjs');
> bcrypt.hashSync('your-password', 10);
```

## Step 9: Testing

### Test LiveKit Connection

```bash
curl http://your-server-ip:7880/
# Should return LiveKit info
```

### Test Next.js App

1. Visit `https://videowall.yourdomain.com`
2. Should see homepage with 3 interface options

### Test Admin Login

1. Go to `https://videowall.yourdomain.com/admin`
2. Login with your credentials
3. Create a test church and service

### Test Video Wall

1. Create a service in admin
2. Add a church
3. Open church interface with codes
4. Allow camera access
5. Open wall display with session code
6. Verify video appears on wall

## Step 10: Monitoring & Maintenance

### Check Logs

```bash
# Next.js logs
docker logs videowall-app -f

# LiveKit logs
docker logs videowall-livekit -f

# PostgreSQL logs
docker logs videowall-db -f
```

### Database Backups

Set up automated backups in Coolify:
1. Go to Database settings
2. Enable **Automated Backups**
3. Schedule: Daily at 2 AM
4. Retention: 7 days

### Monitor Resources

```bash
# Check server resources
htop

# Check disk usage
df -h

# Check Docker stats
docker stats
```

## Troubleshooting

### Issue: Churches can't connect to LiveKit

**Solution:**
1. Check firewall allows UDP 50000-60000
2. Verify `use_external_ip: true` in livekit.yaml
3. Check LiveKit logs for errors

### Issue: Video not showing on wall

**Solution:**
1. Check browser console for errors
2. Verify NEXT_PUBLIC_LIVEKIT_URL is correct
3. Test camera permissions in church interface
4. Check if service is marked as active

### Issue: High CPU usage

**Solution:**
1. Reduce number of simultaneous streams
2. Lower video quality in livekit.yaml
3. Enable dynacast (already configured)
4. Consider upgrading server

### Issue: Database connection errors

**Solution:**
1. Check DATABASE_URL is correct
2. Verify PostgreSQL is running
3. Check database credentials
4. Run `npx prisma db push` again

## Performance Optimization

### For 60+ Churches

If you need to support more than 60 churches:

1. **Upgrade server**:
   - 8 vCPUs
   - 16GB RAM
   - 1Gbps bandwidth

2. **Split services**:
   - Run LiveKit on separate server
   - Use dedicated database server

3. **Enable caching**:
   - Add Redis for session caching
   - Use CDN for static assets

4. **Network optimization**:
   - Enable TURN server for NAT traversal
   - Use regional servers closer to churches

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated unique API keys
- [ ] Enabled SSL/HTTPS
- [ ] Configured firewall rules
- [ ] Set strong database password
- [ ] Enabled automated backups
- [ ] Limited SSH access
- [ ] Updated all packages
- [ ] Configured rate limiting
- [ ] Set up monitoring alerts

## Cost Breakdown

### Monthly Costs (Hetzner CPX41)
- Server: €40 (~$43)
- Domain: $1
- Backups: €5 (~$5)
- **Total: ~$50/month**

### Traffic Estimate
- 60 churches × 4 hours × 350 Kbps = ~36GB per service
- 12 services/year = ~432GB/year
- Well within 20TB/month included bandwidth

## Support & Updates

### Updating the Application

```bash
# In Coolify, go to your app
# Click "Redeploy" to pull latest changes
```

### Manual Update

```bash
# SSH into server
cd /path/to/app
git pull
docker-compose up -d --build
```

## Next Steps

1. ✅ Server deployed and configured
2. ✅ Application running
3. ✅ Admin account created
4. Add your churches
5. Create your first service
6. Test with a few churches
7. Train administrators
8. Go live!

For technical issues, refer to [SPEC.md](./SPEC.md) or check logs.
