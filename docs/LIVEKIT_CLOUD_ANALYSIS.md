# LiveKit Cloud vs Self-Hosted - Cost Analysis

## Your Usage Pattern

- **Churches**: 50-60 per session
- **Session Duration**: 1-3 hours (typical church service/meeting)
- **Frequency**: Once in a while (let's estimate 1-4 times per month)
- **Video Quality**: 240x180 @ 8fps = ~250 Kbps per church

---

## LiveKit Cloud Costs (Pay-as-you-go)

**Rate**: $0.007 per participant minute

### Single Session Costs

| Churches | Duration | Participant Minutes | Cost per Session |
|----------|----------|-------------------|------------------|
| 50 | 1 hour | 50 × 60 = 3,000 | $21.00 |
| 50 | 2 hours | 50 × 120 = 6,000 | $42.00 |
| 50 | 3 hours | 50 × 180 = 9,000 | $63.00 |
| 60 | 1 hour | 60 × 60 = 3,600 | $25.20 |
| 60 | 2 hours | 60 × 120 = 7,200 | $50.40 |
| 60 | 3 hours | 60 × 180 = 10,800 | $75.60 |

### Monthly Costs

| Sessions per Month | Churches | Duration | Monthly Cost |
|-------------------|----------|----------|--------------|
| 1 | 50 | 2 hours | $42.00 |
| 2 | 50 | 2 hours | $84.00 |
| 4 | 50 | 2 hours | $168.00 |
| 1 | 60 | 3 hours | $75.60 |
| 2 | 60 | 3 hours | $151.20 |
| 4 | 60 | 3 hours | $302.40 |

**Best Case**: 1 session/month, 50 churches, 2 hours = **$42/month**  
**Typical Case**: 2 sessions/month, 55 churches, 2.5 hours = **~$100/month**  
**Heavy Use**: 4 sessions/month, 60 churches, 3 hours = **$300/month**

---

## Self-Hosted Costs

### Server Costs (Typical VPS)

| Provider | Specs | Monthly Cost | Notes |
|----------|-------|-------------|-------|
| **DigitalOcean** | 4 vCPU, 8GB RAM, 50GB SSD | $48/month | Basic Droplet |
| **Hetzner** | 4 vCPU, 16GB RAM, 160GB SSD | €15.90 (~$17/month) | Best value |
| **Linode** | 4 vCPU, 8GB RAM, 160GB SSD | $48/month | Reliable |
| **Vultr** | 4 vCPU, 8GB RAM, 180GB SSD | $48/month | Good network |
| **AWS Lightsail** | 2 vCPU, 4GB RAM, 80GB SSD | $40/month | May be underpowered |

**Recommendation**: Hetzner CPX31 = **$17-20/month** (best value)

### Additional Costs
- **Domain**: ~$12/year = $1/month
- **SSL**: Free (Let's Encrypt)
- **Bandwidth**: Usually included (1-5 TB/month)
- **Time/Complexity**: Your time setting up and maintaining

**Total Self-Hosted**: **$18-50/month** + setup time + maintenance

---

## Comparison

| Factor | LiveKit Cloud | Self-Hosted |
|--------|--------------|-------------|
| **Monthly Cost** | $42-$300 (usage-based) | $18-50 (fixed) |
| **Setup Time** | ⚡ 5-10 minutes | ⏰ 2-4 hours |
| **Maintenance** | ✅ Zero (managed) | ⚠️ Ongoing (you maintain) |
| **Reliability** | ✅ 99.9% SLA | ⚠️ Depends on VPS |
| **Support** | ✅ Professional support | ❌ Self-support |
| **Scaling** | ✅ Automatic | ⚠️ Manual |
| **Complexity** | ✅ Simple | ⚠️ Complex |
| **Firewall Issues** | ✅ Handled | ⚠️ You configure |
| **Updates** | ✅ Automatic | ⚠️ You update |

---

## Break-Even Analysis

**If you use it occasionally:**
- 1 session/month @ 2 hours: LiveKit Cloud = $42 vs Self-hosted = $20
- Break-even: ~2 sessions per month

**If you use it regularly:**
- 4+ sessions/month: Self-hosted becomes cheaper
- But adds complexity and maintenance burden

---

## Recommendation

### ✅ Use LiveKit Cloud If:
- ✅ You use it **1-2 times per month** (occasional)
- ✅ You want **zero maintenance**
- ✅ You value **reliability** over cost
- ✅ You don't want to deal with server/firewall issues
- ✅ You're okay with **$50-150/month** usage cost
- ✅ You want to **launch quickly** (today!)

### ✅ Self-Host If:
- ✅ You use it **4+ times per month** (regular)
- ✅ You have **technical expertise**
- ✅ Budget is **very tight** (<$50/month)
- ✅ You can dedicate **time for maintenance**
- ✅ You already have a **server running**
- ✅ You want **full control**

---

## My Recommendation for You

**Use LiveKit Cloud** because:

1. **"Once in a while" usage** = perfect for pay-as-you-go
2. **Occasional use doesn't justify server costs** at $20-50/month
3. **No complexity** - just works
4. **Time savings** - deploy in minutes, not hours
5. **No maintenance** - they handle updates, scaling, issues
6. **Reliability** - enterprise-grade infrastructure
7. **Can switch later** - if usage increases, move to self-hosted

### Cost Estimate for Your Use
If you have **1 zonal meeting per month** with **55 churches** for **2.5 hours**:
- Participant minutes: 55 × 150 = 8,250 minutes
- Cost: 8,250 × $0.007 = **$57.75 per session**
- **Much cheaper than maintaining a server you rarely use!**

---

## Switching to LiveKit Cloud - What Changes?

### Configuration Changes Required

**Environment Variables (New):**
```bash
# Remove these (no longer needed):
# LIVEKIT_URL=wss://livekit.yourdomain.com
# NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com

# Replace with LiveKit Cloud:
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=<from LiveKit Cloud dashboard>
LIVEKIT_API_SECRET=<from LiveKit Cloud dashboard>
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

**What to Deploy:**
- ❌ No LiveKit docker-compose service needed
- ✅ PostgreSQL (standalone service)
- ✅ Main App (Docker application)

**That's it!** Two services instead of three.

---

## Quick Start with LiveKit Cloud

### Step 1: Create LiveKit Cloud Account
1. Go to https://cloud.livekit.io/
2. Sign up (free to start)
3. Create a new project

### Step 2: Get Your Credentials
1. In LiveKit Cloud dashboard, go to **Settings** → **Keys**
2. Create a new API Key
3. Copy:
   - **API Key** (starts with `API`)
   - **API Secret** (long base64 string)
   - **WebSocket URL** (wss://your-project.livekit.cloud)

### Step 3: Update Your Deployment

**In Coolify, deploy only 2 services:**

#### 1. PostgreSQL (Database Service)
- Same as before

#### 2. Main Application (Docker Application)
```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/videowall

# NextAuth
NEXTAUTH_URL=https://videowall.yourdomain.com
NEXTAUTH_SECRET=<generate>

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<secure-password>

# LiveKit Cloud (from Step 2)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=API... (from LiveKit Cloud)
LIVEKIT_API_SECRET=... (from LiveKit Cloud)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# App
NEXT_PUBLIC_APP_NAME=Virtual Video Wall
NEXT_PUBLIC_MAX_CHURCHES=60
```

### Step 4: Deploy & Test
1. Deploy main application
2. Initialize database: `npx prisma db push && npx prisma db seed`
3. Test - it just works! No firewall, no UDP ports, no complexity.

---

## Migration Path

If you later decide to self-host (heavy usage):
1. Spin up LiveKit server
2. Update environment variables
3. Redeploy app
4. **No code changes needed!**

The application is designed to work with both.

---

## Final Recommendation

**Start with LiveKit Cloud now:**
- ✅ Get up and running in **10 minutes**
- ✅ Use it for your upcoming sessions
- ✅ Track actual usage and costs
- ✅ If costs exceed $100-150/month consistently, **then** consider self-hosting

**Don't over-optimize prematurely!** Your time is valuable. Get it working first, optimize later if needed.

---

## Quick Cost Calculator

Use this to estimate your costs:

```
Monthly Cost = (Churches × Duration_minutes × Sessions_per_month) × $0.007

Example:
- 55 churches
- 2.5 hours per session = 150 minutes
- 2 sessions per month

Cost = (55 × 150 × 2) × $0.007 = $115.50/month
```

---

## Support

- **LiveKit Cloud Docs**: https://docs.livekit.io/
- **LiveKit Cloud Dashboard**: https://cloud.livekit.io/
- **LiveKit Cloud Support**: support@livekit.io
- **Pricing Calculator**: https://livekit.io/pricing

---

**Bottom Line**: For "once in a while" usage, LiveKit Cloud at $40-80/session is **way better** than paying $20-50/month for a server you rarely use, plus the complexity and maintenance burden.
