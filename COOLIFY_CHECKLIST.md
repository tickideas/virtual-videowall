# Coolify Deployment Checklist - Standalone Services

Quick reference for deploying Virtual Video Wall on Coolify with separate services.

## Before You Start

Generate your keys:
```bash
# LiveKit API Key
echo "LK$(openssl rand -hex 16)"

# LiveKit API Secret  
openssl rand -base64 32

# NextAuth Secret
openssl rand -base64 32
```

**Save these values!** You'll need them multiple times.

---

## Deployment Order

### 1️⃣ PostgreSQL Database (Service 1)

- [ ] Create PostgreSQL service in Coolify
- [ ] Set database name: `videowall`
- [ ] Set username: `videowall_user`
- [ ] Generate strong password
- [ ] **Save connection URL**: `postgresql://videowall_user:PASSWORD@SERVICE-NAME:5432/videowall`
- [ ] Deploy and verify running

---

### 2️⃣ LiveKit Server (Service 2)

#### Setup
- [ ] Create Docker Compose service in Coolify
- [ ] Repository: `https://github.com/tickideas/virtual-videowall.git`
- [ ] Branch: `main`
- [ ] Docker Compose file: `docker-compose.livekit.yml`

#### Environment Variables
```bash
LIVEKIT_API_KEY=LK... (your generated key)
LIVEKIT_API_SECRET=... (your generated secret)
```
- [ ] Add both variables in Coolify

#### Domain & Ports
- [ ] Set domain: `livekit.yourdomain.com`
- [ ] Enable SSL (Let's Encrypt)
- [ ] Expose port 7880 (WebSocket)
- [ ] Expose port 7881 (TCP fallback)
- [ ] Expose ports 51000-51100 UDP (**critical!**)

#### Firewall
- [ ] Configure server firewall: `ufw allow 51000:51100/udp`
- [ ] Verify UDP ports are accessible from internet

#### Deploy & Test
- [ ] Click Deploy
- [ ] Check logs - should see "Starting LiveKit server"
- [ ] Test: `curl https://livekit.yourdomain.com` → should return "OK"

---

### 3️⃣ Main Application (Service 3)

#### Setup
- [ ] Create Docker Application in Coolify
- [ ] Repository: `https://github.com/tickideas/virtual-videowall.git`
- [ ] Branch: `main`
- [ ] Build Pack: Docker
- [ ] Dockerfile: `Dockerfile` (default)

#### Environment Variables (ALL required)
```bash
# Database (from step 1)
DATABASE_URL=postgresql://videowall_user:PASSWORD@SERVICE-NAME:5432/videowall?schema=public

# NextAuth
NEXTAUTH_URL=https://videowall.yourdomain.com
NEXTAUTH_SECRET=(your generated secret)

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=(strong password)

# LiveKit - SAME URL for both! (from step 2)
LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=(same as LiveKit service)
LIVEKIT_API_SECRET=(same as LiveKit service)
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com

# App
NEXT_PUBLIC_APP_NAME=Virtual Video Wall
NEXT_PUBLIC_MAX_CHURCHES=60
```
- [ ] Add all variables in Coolify
- [ ] **Verify keys match LiveKit service exactly**

#### Domain
- [ ] Set domain: `videowall.yourdomain.com`
- [ ] Enable SSL (Let's Encrypt)

#### Deploy
- [ ] Click Deploy
- [ ] Wait for build to complete (~5-10 minutes)

#### Initialize Database
```bash
# Via Coolify terminal or SSH
docker exec -it <container-name> npx prisma db push
docker exec -it <container-name> npx prisma db seed
```
- [ ] Run database migrations
- [ ] Run database seed

---

## Post-Deployment Testing

### Test 1: Services Running
```bash
docker ps | grep videowall
```
- [ ] Should see 3 containers running

### Test 2: LiveKit Health
```bash
curl https://livekit.yourdomain.com
```
- [ ] Should return: "OK"

### Test 3: Admin Login
- [ ] Visit: `https://videowall.yourdomain.com/admin`
- [ ] Login with admin credentials
- [ ] Should see dashboard

### Test 4: Create Church
- [ ] In admin, create a new church
- [ ] Should get 6-digit code
- [ ] Save code for next test

### Test 5: Create Service
- [ ] In admin, create a new service
- [ ] Should get session code
- [ ] Copy session code and "Open Wall" link

### Test 6: Church Interface
- [ ] Visit: `https://videowall.yourdomain.com/church`
- [ ] Enter session code from Test 5
- [ ] Allow camera access
- [ ] Should see video preview
- [ ] Click "Go Live"
- [ ] Should connect successfully

### Test 7: Wall Display
- [ ] Open the "Open Wall" link from Test 5
- [ ] Should see video grid
- [ ] Should see the church you connected in Test 6
- [ ] Video should be playing

### Test 8: Mobile Testing
- [ ] Repeat Test 6 on mobile device (iOS Safari or Android Chrome)
- [ ] Verify camera works on mobile
- [ ] Verify connection is stable

---

## Common Issues & Quick Fixes

### ❌ LiveKit: "one of key-file or keys must be provided"
**Fix**: 
```bash
# Check environment variables are set
docker exec <livekit-container> env | grep LIVEKIT
```
If not showing, add them in Coolify and redeploy.

### ❌ App: "Failed to connect to database"
**Fix**: 
- Check DATABASE_URL uses correct hostname (PostgreSQL service name)
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Test connection: `docker exec <app-container> nc -zv <postgres-hostname> 5432`

### ❌ App: "Invalid token" or "Failed to generate token"
**Fix**:
- Verify keys match EXACTLY between LiveKit and app:
```bash
docker exec <livekit-container> env | grep LIVEKIT_API_KEY
docker exec <app-container> env | grep LIVEKIT_API_KEY
```
- If different, update and redeploy

### ❌ Church: "Failed to connect to LiveKit"
**Fix**:
- Verify NEXT_PUBLIC_LIVEKIT_URL is publicly accessible
- Test WebSocket: `wscat -c wss://livekit.yourdomain.com`
- Check browser console for errors
- Ensure using HTTPS (cameras require secure context)

### ❌ Wall: No video showing
**Fix**:
- Check UDP ports 51000-51100 are open: `ufw status`
- Test UDP: `nc -u -zv livekit.yourdomain.com 51000`
- Verify church successfully connected (check admin dashboard)
- Check browser console for WebRTC errors

---

## Security Checklist

Before going live:
- [ ] Changed all default passwords
- [ ] Generated unique LiveKit keys (not defaults)
- [ ] Generated unique NEXTAUTH_SECRET
- [ ] PostgreSQL not exposed publicly
- [ ] All services using HTTPS
- [ ] Firewall configured (only required ports open)
- [ ] No `.env` file in repository
- [ ] Admin password is strong

---

## Useful Commands

```bash
# View all containers
docker ps

# Check logs
docker logs -f <container-name>

# Restart service
docker restart <container-name>

# Check environment variables
docker exec <container-name> env | grep LIVEKIT

# Database migrations
docker exec <app-container> npx prisma db push

# Test connections
curl https://livekit.yourdomain.com
curl https://videowall.yourdomain.com
```

---

## Your Deployment Details

Fill this out as you deploy:

### LiveKit Service
- Domain: `livekit.___________________`
- API Key: `LK___________________`
- API Secret: `___________________`

### PostgreSQL Service  
- Internal hostname: `___________________`
- Database name: `videowall`
- Username: `videowall_user`
- Password: `___________________`

### Main Application
- Domain: `videowall.___________________`
- Admin Email: `___________________`
- Admin Password: `___________________`
- NextAuth Secret: `___________________`

---

## Next Steps

1. ✅ Complete all checkboxes above
2. 📱 Test with real devices (mobile & desktop)
3. 👥 Train administrators on the system
4. 📊 Monitor performance during first session
5. 📝 Document any issues or customizations
6. 🔄 Set up backup procedures

---

**Need Help?**
- Full guide: See `COOLIFY_STANDALONE_DEPLOYMENT.md`
- Project docs: See `SPEC.md`, `DEPLOYMENT.md`
- Quick fix: See `COOLIFY_FIX_SUMMARY.md`
