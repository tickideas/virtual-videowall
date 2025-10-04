# Switch to LiveKit Cloud - Simple Guide

**TL;DR**: Use LiveKit Cloud. It's simpler, no server complexity, and cheaper for occasional use.

---

## Why LiveKit Cloud?

✅ **No server to manage** - they handle everything  
✅ **No firewall issues** - no UDP port configuration  
✅ **No maintenance** - always up-to-date  
✅ **Deploy in 10 minutes** - not 4 hours  
✅ **Pay only when used** - perfect for "once in a while"  
✅ **Reliable** - enterprise infrastructure  

💰 **Cost**: ~$42-75 per session (2-3 hours, 50-60 churches)  
vs  
💰 **Self-hosted**: ~$20-50/month + complexity + your time

---

## Quick Setup (10 Minutes)

### 1️⃣ Create LiveKit Cloud Account (2 minutes)

1. Go to: https://cloud.livekit.io/
2. Click **Sign Up** (use Google/GitHub for quick signup)
3. Create a new project (give it a name like "virtual-videowall")

### 2️⃣ Get Your Credentials (1 minute)

1. In dashboard, go to **Settings** → **Keys**
2. Click **Create Key**
3. Copy these 3 values:

```
WebSocket URL: wss://your-project.livekit.cloud
API Key: APIxxxxxxxxxxxxxxxx
API Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Save these!** You'll need them in step 4.

### 3️⃣ Deploy Database in Coolify (2 minutes)

1. In Coolify: **+ New Resource** → **Database** → **PostgreSQL**
2. Configure:
   - Database name: `videowall`
   - Username: `videowall_user`
   - Password: (generate strong password)
3. **Deploy**
4. **Save the connection URL** (you'll see it in Coolify)

### 4️⃣ Deploy Application in Coolify (5 minutes)

1. In Coolify: **+ New Resource** → **Application** → **Docker**
2. Configure:
   - Repository: `https://github.com/tickideas/virtual-videowall.git`
   - Branch: `main`
   - Dockerfile: `Dockerfile`
3. **Add Environment Variables**:

```bash
# Database (from Step 3)
DATABASE_URL=postgresql://videowall_user:YOUR_PASSWORD@postgres-service:5432/videowall?schema=public

# NextAuth
NEXTAUTH_URL=https://videowall.yourdomain.com
NEXTAUTH_SECRET=GENERATE_THIS_RUN: openssl rand -base64 32

# Admin Credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD

# LiveKit Cloud (from Step 2) ⭐ THIS IS THE KEY CHANGE
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# App Settings
NEXT_PUBLIC_APP_NAME=Virtual Video Wall
NEXT_PUBLIC_MAX_CHURCHES=60
```

4. **Set Domain**: `videowall.yourdomain.com`
5. **Enable SSL** (Let's Encrypt)
6. **Deploy**

### 5️⃣ Initialize Database (1 minute)

After deployment completes:

```bash
# In Coolify, open Terminal for your app container
npx prisma db push
npx prisma db seed
```

Or via SSH:
```bash
docker exec -it <container-name> npx prisma db push
docker exec -it <container-name> npx prisma db seed
```

---

## That's It! 🎉

**No LiveKit server to deploy!**  
**No UDP ports to configure!**  
**No firewall issues!**  

Just 2 services instead of 3:
- ✅ PostgreSQL
- ✅ Main Application
- ❌ ~~LiveKit Server~~ (using cloud instead)

---

## Test Your Deployment

### 1. Test Admin Login
- Visit: `https://videowall.yourdomain.com/admin`
- Login with your admin credentials
- Should see dashboard ✅

### 2. Create a Test Church
- In admin, click **Churches**
- Create new church (any name)
- Note the 6-digit code ✅

### 3. Create a Test Service
- In admin, click **Services**
- Create new service
- Note the session code ✅

### 4. Test Church Interface
- Visit: `https://videowall.yourdomain.com/church`
- Enter session code
- Allow camera
- Click "Go Live"
- Should connect instantly ✅

### 5. Test Wall Display
- Visit: `https://videowall.yourdomain.com/wall/SESSION_CODE`
- Should see video grid
- Should see your connected church ✅

---

## What About the Documentation?

You can **ignore** these complex files now:
- ❌ ~~`docker-compose.livekit.yml`~~ (not needed)
- ❌ ~~`livekit.yaml`~~ (not needed)
- ❌ ~~`COOLIFY_STANDALONE_DEPLOYMENT.md`~~ (too complex)
- ❌ ~~`COOLIFY_FIX_SUMMARY.md`~~ (not relevant)

Keep these:
- ✅ `README.md` - General overview
- ✅ `SPEC.md` - Project specification
- ✅ `QUICKSTART.md` - Local development
- ✅ `LIVEKIT_CLOUD_ANALYSIS.md` - Cost analysis
- ✅ This file - Your deployment guide!

---

## Cost Tracking

Monitor your usage in LiveKit Cloud dashboard:
1. Go to **Analytics** → **Usage**
2. See participant minutes used
3. Calculate cost: `minutes × $0.007`

**Set up billing alerts** to avoid surprises!

---

## Troubleshooting

### "Failed to connect to LiveKit"
**Check:**
```bash
# Verify environment variables
docker exec <container> env | grep LIVEKIT

# Should show:
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxx
```

**Fix**: Ensure variables are set correctly in Coolify.

### "Invalid token"
**Check**: API Key and Secret match LiveKit Cloud dashboard exactly.

**Fix**: Copy-paste from LiveKit Cloud dashboard (no typos).

### "Database connection failed"
**Check**: DATABASE_URL points to your PostgreSQL service.

**Fix**: Verify PostgreSQL is running: `docker ps | grep postgres`

### Everything else just works! ✨

LiveKit Cloud handles:
- ✅ WebSocket connections
- ✅ Media routing
- ✅ Firewall traversal
- ✅ TURN/STUN servers
- ✅ Scaling
- ✅ Updates
- ✅ Monitoring

---

## When to Consider Self-Hosting

Switch to self-hosted if:
- 📊 You're consistently spending **$150+/month** on LiveKit Cloud
- 📅 You're running **4+ sessions per month**
- 💪 You have **technical expertise** and time
- 🎯 You want **full control**

Otherwise, **stick with LiveKit Cloud!**

---

## Migration Back to Self-Hosted (Later)

If you decide to self-host later:

1. Deploy your own LiveKit server
2. Change these environment variables:
   ```bash
   LIVEKIT_URL=wss://livekit.yourdomain.com
   LIVEKIT_API_KEY=<your-own-key>
   LIVEKIT_API_SECRET=<your-own-secret>
   NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
   ```
3. Redeploy application
4. **No code changes needed!**

---

## Support Resources

**LiveKit Cloud:**
- Dashboard: https://cloud.livekit.io/
- Docs: https://docs.livekit.io/
- Support: support@livekit.io

**Your Application:**
- GitHub: https://github.com/tickideas/virtual-videowall
- Issues: https://github.com/tickideas/virtual-videowall/issues

---

## Summary

**Old Way (Self-Hosted):**
- 3 services to deploy ❌
- Firewall configuration ❌
- UDP ports setup ❌
- Server maintenance ❌
- 4 hours setup time ❌
- Complex troubleshooting ❌

**New Way (LiveKit Cloud):**
- 2 services to deploy ✅
- No firewall config ✅
- No ports to open ✅
- Zero maintenance ✅
- 10 minutes setup time ✅
- Just works ✅

---

**Bottom Line**: For occasional use, LiveKit Cloud is the obvious choice. Deploy now, optimize later if needed! 🚀
