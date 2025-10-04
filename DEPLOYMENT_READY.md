# 🚀 Deployment Ready - Next Steps

## ✅ What Was Fixed

The LiveKit deployment error **"one of key-file or keys must be provided"** has been resolved by:

1. **Updated `docker-compose.livekit.yml`** to properly read API keys from environment variables
2. **Created comprehensive deployment guides** for Coolify standalone services
3. **Updated `.env.example`** with proper configurations for standalone deployment

## 📋 Your Deployment Path

Since you're deploying as **standalone services**, follow these steps:

### Step 1: Deploy LiveKit Service ⚡

1. In Coolify, create a new **Docker Compose Service**
2. Repository: `https://github.com/tickideas/virtual-videowall.git`
3. Branch: `main`
4. Docker Compose file: `docker-compose.livekit.yml`

**Add these environment variables:**
```bash
LIVEKIT_API_KEY=LK41e534fcd2edbeb7
LIVEKIT_API_SECRET=34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg=
```

⚠️ **For production, generate new keys:**
```bash
echo "LK$(openssl rand -hex 16)"  # Generate API Key
openssl rand -base64 32           # Generate API Secret
```

4. Set domain: `livekit.yourdomain.com`
5. Enable SSL
6. **Expose ports**:
   - 7880 (WebSocket)
   - 7881 (TCP fallback)
   - 51000-51100/udp (**critical!**)

7. **Deploy and verify:**
```bash
curl https://livekit.yourdomain.com
# Should return: OK
```

### Step 2: Deploy PostgreSQL Service 🗄️

1. In Coolify, create a **PostgreSQL Database**
2. Database name: `videowall`
3. Username: `videowall_user`
4. Password: (generate strong password)
5. **Save the connection URL** for next step

### Step 3: Deploy Main Application 🌐

1. In Coolify, create a **Docker Application**
2. Repository: `https://github.com/tickideas/virtual-videowall.git`
3. Branch: `main`
4. Dockerfile: `Dockerfile`

**Add ALL these environment variables:**
```bash
# Database (from Step 2)
DATABASE_URL=postgresql://videowall_user:PASSWORD@postgres-hostname:5432/videowall?schema=public

# NextAuth
NEXTAUTH_URL=https://videowall.yourdomain.com
NEXTAUTH_SECRET=(generate with: openssl rand -base64 32)

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=(strong password)

# LiveKit (from Step 1 - MUST match exactly!)
LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=LK41e534fcd2edbeb7
LIVEKIT_API_SECRET=34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg=
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com

# App
NEXT_PUBLIC_APP_NAME=Virtual Video Wall
NEXT_PUBLIC_MAX_CHURCHES=60
```

5. Set domain: `videowall.yourdomain.com`
6. Enable SSL
7. Deploy

8. **Initialize database:**
```bash
docker exec -it <container-name> npx prisma db push
docker exec -it <container-name> npx prisma db seed
```

### Step 4: Configure Firewall 🔒

**On your Coolify server:**
```bash
# Allow UDP ports for RTC media (CRITICAL!)
ufw allow 51000:51100/udp

# Verify
ufw status
```

### Step 5: Test Everything ✅

Follow the checklist in `COOLIFY_CHECKLIST.md`:
- [ ] Admin login works
- [ ] Can create churches
- [ ] Can create services
- [ ] Church interface connects
- [ ] Video shows on wall

## 📚 Documentation Created

All guides are now in your repository:

| File | Purpose |
|------|---------|
| `COOLIFY_CHECKLIST.md` | **Start here** - Quick deployment checklist |
| `COOLIFY_STANDALONE_DEPLOYMENT.md` | Complete step-by-step guide |
| `COOLIFY_FIX_SUMMARY.md` | Quick reference for the fix |
| `ARCHITECTURE.md` | System architecture diagrams |
| `.env.example` | Updated environment variables template |

## 🔑 Critical Points for Standalone Services

1. **Same URL for both**: `LIVEKIT_URL` and `NEXT_PUBLIC_LIVEKIT_URL` must be identical
   ```bash
   LIVEKIT_URL=wss://livekit.yourdomain.com
   NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
   ```

2. **Keys must match**: LiveKit service and main app must have identical keys
   ```bash
   # In LiveKit service
   LIVEKIT_API_KEY=LKxxxx
   LIVEKIT_API_SECRET=yyyy
   
   # In Main app (MUST BE EXACT SAME)
   LIVEKIT_API_KEY=LKxxxx
   LIVEKIT_API_SECRET=yyyy
   ```

3. **UDP ports required**: Ports 51000-51100/udp must be directly accessible
   - Cannot be proxied
   - Must configure firewall
   - Critical for video streaming

4. **Use wss:// for HTTPS**: All LiveKit URLs must use `wss://` (secure WebSocket)

## 🐛 Troubleshooting Quick Reference

### "one of key-file or keys must be provided"
```bash
# Check if environment variables are set
docker exec <livekit-container> env | grep LIVEKIT

# If empty, add them in Coolify and redeploy
```

### "Failed to connect to database"
```bash
# Verify DATABASE_URL is correct
docker exec <app-container> env | grep DATABASE_URL

# Test connection
docker exec <app-container> nc -zv postgres-hostname 5432
```

### "Invalid token"
```bash
# Keys must match exactly
docker exec <livekit-container> env | grep LIVEKIT_API_KEY
docker exec <app-container> env | grep LIVEKIT_API_KEY

# Compare - must be identical
```

### "WebSocket connection failed"
```bash
# Test WebSocket
wscat -c wss://livekit.yourdomain.com

# Check if port 7880 is accessible
curl https://livekit.yourdomain.com
```

### "No video showing"
```bash
# Check UDP ports are open
ufw status | grep 51000

# Test UDP (if netcat supports UDP)
nc -u -zv livekit.yourdomain.com 51000
```

## 📞 Need Help?

1. **Quick start**: `COOLIFY_CHECKLIST.md`
2. **Full guide**: `COOLIFY_STANDALONE_DEPLOYMENT.md`
3. **Architecture**: `ARCHITECTURE.md`
4. **GitHub Issues**: https://github.com/tickideas/virtual-videowall/issues

## ✨ What's Different from Docker Compose?

In standalone deployment:
- ❌ No internal Docker network names (like `livekit:7880`)
- ✅ Use public URLs for everything (like `wss://livekit.yourdomain.com`)
- ✅ All services communicate via public internet
- ✅ Each service is independent and can be scaled separately

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] All 3 services show "running" in Coolify
- [ ] `curl https://livekit.yourdomain.com` returns "OK"
- [ ] Admin dashboard is accessible
- [ ] Churches can connect and stream
- [ ] Video shows on wall display
- [ ] Works on mobile devices

---

**You're all set!** The code is pushed to GitHub. Now just follow the deployment checklist in Coolify. 🚀
