# Coolify Deployment Guide for Virtual Video Wall

This guide walks through deploying the Virtual Video Wall on Coolify, including LiveKit server configuration.

## Prerequisites

- Coolify instance running and accessible
- GitHub repository access configured in Coolify
- Domain or subdomain for the deployment
- SSL certificates (Coolify can handle with Let's Encrypt)

## Step 1: Environment Variables

In your Coolify project settings, add these environment variables:

### LiveKit Configuration
```bash
LIVEKIT_API_KEY=LK41e534fcd2edbeb7
LIVEKIT_API_SECRET=34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg=
```

⚠️ **IMPORTANT**: Generate your own keys for production:
```bash
# Generate API Key (starts with LK)
echo "LK$(openssl rand -hex 16)"

# Generate API Secret
openssl rand -base64 32
```

### Database
```bash
DATABASE_URL=postgresql://user:password@postgres:5432/videowall?schema=public
```

### NextAuth
```bash
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

### Admin Credentials
```bash
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<secure-password>
```

### LiveKit URLs
```bash
# Server-side (internal)
LIVEKIT_URL=ws://livekit:7880

# Client-side (publicly accessible)
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.your-domain.com
```

### App Settings
```bash
NEXT_PUBLIC_APP_NAME=Virtual Video Wall
NEXT_PUBLIC_MAX_CHURCHES=60
```

## Step 2: Deploy LiveKit Service

1. **Create New Service** in Coolify:
   - Type: Docker Compose
   - Repository: `tickideas/virtual-videowall`
   - Branch: `main`
   - Docker Compose File: `docker-compose.livekit.yml`

2. **Configure Ports**:
   - Port `7880` (WebSocket/HTTP) → expose publicly or via proxy
   - Port `7881` (TCP fallback) → expose if needed
   - Ports `51000-51100/udp` (RTC) → **must be exposed publicly**

3. **Important Network Settings**:
   - Enable **UDP port range** `51000-51100` in your firewall
   - If using a reverse proxy for WebSocket (port 7880), ensure it supports WebSocket upgrades

4. **Deploy** the service

### Troubleshooting LiveKit

If you see "one of key-file or keys must be provided":
- Verify `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set in Coolify
- Check container logs: `docker logs <container-name>`
- Ensure environment variables are being passed correctly

Common issues:
```bash
# Check if keys are in the config
docker exec <container-id> cat /livekit.yaml

# Should show:
# keys:
#   LK41e534fcd2edbeb7: "34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg="
```

## Step 3: Deploy Main Application

1. **Create New Service**:
   - Type: Docker
   - Repository: `tickideas/virtual-videowall`
   - Branch: `main`
   - Dockerfile: `Dockerfile`

2. **Build Configuration**:
   - Build command: (default)
   - Start command: (default from Dockerfile)

3. **Network**:
   - Must be on same network as LiveKit service (use `livekit` as hostname)
   - Expose port `3000` publicly via Coolify proxy

4. **Deploy** the application

## Step 4: Database Setup

Option A: **Use Coolify's PostgreSQL service**
```bash
# In Coolify, create a PostgreSQL service
# Update DATABASE_URL to point to the service
DATABASE_URL=postgresql://user:password@postgres-service:5432/videowall?schema=public
```

Option B: **Use external database**
```bash
DATABASE_URL=postgresql://user:password@external-host:5432/videowall?schema=public
```

### Initialize Database

After deployment, run migrations:
```bash
# SSH into the application container
docker exec -it <container-name> sh

# Run Prisma migrations
npx prisma db push
npx prisma db seed
```

## Step 5: Reverse Proxy Configuration

### LiveKit WebSocket Proxy (Nginx/Caddy)

**Nginx example:**
```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 443 ssl;
    server_name livekit.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Important for WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

**Caddy example:**
```
livekit.your-domain.com {
    reverse_proxy localhost:7880
}
```

### Firewall Rules

Ensure these ports are open:
- `443` (HTTPS) - Application
- `7880` (WebSocket) - LiveKit (or via reverse proxy on 443)
- `7881` (TCP) - LiveKit TCP fallback
- `51000-51100/udp` - LiveKit RTC media

## Step 6: Post-Deployment Verification

### 1. Check LiveKit Health
```bash
curl http://livekit.your-domain.com/
# Should return: "OK"
```

### 2. Test Database Connection
Visit: `https://your-domain.com/admin`
- Login with admin credentials
- Create a test church
- Create a test service

### 3. Test Church Interface
- Visit: `https://your-domain.com/church`
- Enter a valid session code
- Allow camera access
- Verify video preview works
- Click "Go Live"

### 4. Test Wall Display
- Visit: `https://your-domain.com/wall/<session-code>`
- Should show connected churches in grid

## Monitoring

### Container Logs
```bash
# Main application
docker logs -f <app-container>

# LiveKit server
docker logs -f <livekit-container>
```

### LiveKit Metrics
LiveKit exposes Prometheus metrics on port `6789` (if enabled in config)

## Troubleshooting

### "Failed to connect to LiveKit"
1. Check `NEXT_PUBLIC_LIVEKIT_URL` is publicly accessible
2. Verify WebSocket connection: `wscat -c wss://livekit.your-domain.com`
3. Check browser console for errors
4. Ensure HTTPS is used (cameras require secure context)

### "Invalid token" errors
1. Verify `LIVEKIT_API_KEY` matches on both server and application
2. Check `LIVEKIT_API_SECRET` is correct
3. Ensure no extra whitespace in environment variables

### Video not showing on wall
1. Check church successfully joined (admin dashboard)
2. Verify network can handle UDP traffic
3. Test bandwidth: churches need stable 300-500 Kbps
4. Check browser console for WebRTC errors

### Database connection errors
1. Verify `DATABASE_URL` is correct
2. Check database service is running
3. Ensure network connectivity between containers
4. Run `npx prisma db push` to sync schema

## Performance Optimization

### For 50-60 Churches

1. **Server Resources**:
   - CPU: 4+ cores
   - RAM: 8GB minimum
   - Network: 50 Mbps upload minimum (0.5 Mbps × 60 churches)

2. **Database**:
   - Use connection pooling
   - Add indexes (already in schema)
   - Consider read replicas for large deployments

3. **LiveKit**:
   - Use external IP for better connectivity
   - Configure TURN server for restrictive networks
   - Monitor CPU usage during active sessions

## Backup Strategy

### Database Backups
```bash
# Automated daily backup
docker exec <postgres-container> pg_dump -U user videowall > backup-$(date +%Y%m%d).sql
```

### Configuration Backups
- Export all environment variables from Coolify
- Store securely (encrypted)
- Document any custom configurations

## Scaling Considerations

For more than 60 churches:
- Deploy multiple LiveKit servers (round-robin)
- Use LiveKit's distributed mode
- Add CDN for static assets
- Consider database clustering

## Support

- GitHub Issues: https://github.com/tickideas/virtual-videowall/issues
- Documentation: See `SPEC.md` and `DEPLOYMENT.md`
- Community: [Your support channel]

---

**Security Checklist:**
- [ ] Changed default API keys
- [ ] Changed default admin password
- [ ] HTTPS enabled for all endpoints
- [ ] Firewall configured correctly
- [ ] Database credentials are strong
- [ ] `.env` file not committed to repository
- [ ] Backup strategy in place
- [ ] Monitoring configured
