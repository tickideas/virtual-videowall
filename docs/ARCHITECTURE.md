# Architecture: Standalone Services on Coolify

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Your Coolify Server                            │
│                         (Public IP: xxx.xxx.xxx.xxx)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
      ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
      │   PostgreSQL    │  │  LiveKit Server │  │  Main App       │
      │   Database      │  │                 │  │  (Next.js)      │
      │                 │  │                 │  │                 │
      │  Container:     │  │  Container:     │  │  Container:     │
      │  postgres-xxx   │  │  livekit-xxx    │  │  videowall-xxx  │
      │                 │  │                 │  │                 │
      │  Port: 5432     │  │  Ports:         │  │  Port: 3000     │
      │  (Internal)     │  │  7880 (WS)      │  │  (Public)       │
      │                 │  │  7881 (TCP)     │  │                 │
      │  Network:       │  │  51000-51100    │  │  Domain:        │
      │  Internal only  │  │  (UDP)          │  │  videowall.     │
      │                 │  │                 │  │  yourdomain.com │
      │                 │  │  Domain:        │  │                 │
      │                 │  │  livekit.       │  │  SSL: ✅        │
      │                 │  │  yourdomain.com │  │                 │
      │                 │  │                 │  │                 │
      │                 │  │  SSL: ✅        │  │                 │
      └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
               │                    │                    │
               │                    │                    │
               │      Internal      │    Public URLs     │
               │      Connection    │    (wss://...)     │
               │                    │                    │
               └────────────────────┴────────────────────┘
                                    │
                                    ▼
                      ┌──────────────────────────┐
                      │    Internet Users        │
                      │  (Churches & Wall)       │
                      └──────────────────────────┘
```

## Connection Flow

### 1. Church Interface Connection
```
Church Browser (HTTPS)
    │
    ├─→ HTTPS: videowall.yourdomain.com
    │   └─→ Main App (loads page, gets session code)
    │
    └─→ WSS: livekit.yourdomain.com
        └─→ LiveKit Server (WebSocket for signaling)
            └─→ UDP: 51000-51100 (RTC media streams)
```

### 2. Wall Display Connection
```
Wall Browser (HTTPS)
    │
    ├─→ HTTPS: videowall.yourdomain.com/wall/[code]
    │   └─→ Main App (loads page, gets church list)
    │
    └─→ WSS: livekit.yourdomain.com
        └─→ LiveKit Server (WebSocket for signaling)
            └─→ UDP: 51000-51100 (receives RTC media streams)
```

### 3. Admin Dashboard Connection
```
Admin Browser (HTTPS)
    │
    └─→ HTTPS: videowall.yourdomain.com/admin
        └─→ Main App
            └─→ Internal: postgres-service:5432
                └─→ PostgreSQL Database
```

## Data Flow

### Service Creation Flow
```
Admin creates service in dashboard
    │
    ├─→ Main App generates session code
    │   └─→ Stores in PostgreSQL
    │
    └─→ Admin shares session code with churches
```

### Church Streaming Flow
```
Church enters session code
    │
    ├─→ Main App validates code (PostgreSQL)
    │   └─→ Generates LiveKit token
    │       └─→ Uses LIVEKIT_API_KEY + LIVEKIT_API_SECRET
    │
    └─→ Church connects to LiveKit
        ├─→ WebSocket: wss://livekit.yourdomain.com:7880
        └─→ RTC Media: UDP ports 51000-51100
            └─→ Streams video (240x180 @ 8fps)
```

### Wall Display Flow
```
Wall opens with session code
    │
    ├─→ Main App gets active churches (PostgreSQL)
    │   └─→ Generates LiveKit token for subscriber
    │
    └─→ Wall connects to LiveKit
        ├─→ WebSocket: wss://livekit.yourdomain.com:7880
        └─→ RTC Media: UDP ports 51000-51100
            └─→ Receives all church streams
            └─→ Displays in paginated grid (20 per page)
```

## Environment Variables Flow

### LiveKit Service
```yaml
Environment Variables (Set in Coolify):
  LIVEKIT_API_KEY: LK3f2a8b9c...
  LIVEKIT_API_SECRET: X9kL2mN3oP...
        │
        ▼
docker-compose.livekit.yml (reads from env)
        │
        ▼
Generated /livekit.yaml inside container:
  keys:
    LK3f2a8b9c...: "X9kL2mN3oP..."
```

### Main Application
```yaml
Environment Variables (Set in Coolify):
  DATABASE_URL: postgresql://...
  LIVEKIT_URL: wss://livekit.yourdomain.com
  LIVEKIT_API_KEY: LK3f2a8b9c... (MUST MATCH LiveKit)
  LIVEKIT_API_SECRET: X9kL2mN3oP... (MUST MATCH LiveKit)
  NEXT_PUBLIC_LIVEKIT_URL: wss://livekit.yourdomain.com
        │
        ▼
Next.js Application (uses at runtime)
        │
        ├─→ Server-side: Uses LIVEKIT_URL for token generation
        └─→ Client-side: Uses NEXT_PUBLIC_LIVEKIT_URL for connection
```

## Port Mapping

| Service | Internal Port | External Port | Protocol | Public? | Purpose |
|---------|--------------|---------------|----------|---------|---------|
| PostgreSQL | 5432 | N/A | TCP | ❌ No | Database queries |
| LiveKit | 7880 | 443 (via proxy) | TCP/WS | ✅ Yes | WebSocket signaling |
| LiveKit | 7881 | 7881 | TCP | ⚠️ Optional | TCP fallback |
| LiveKit | 51000-51100 | 51000-51100 | UDP | ✅ **Required** | RTC media streams |
| Main App | 3000 | 443 (via proxy) | TCP/HTTP | ✅ Yes | Web application |

**Critical Notes:**
- ✅ UDP ports 51000-51100 **MUST** be directly accessible (cannot be proxied)
- ✅ Port 7880 can be proxied but must support WebSocket upgrades
- ❌ PostgreSQL should NEVER be exposed publicly
- ✅ All HTTP traffic should be via HTTPS (SSL required for camera access)

## Network Security

### Firewall Rules Required
```bash
# Allow HTTPS
ufw allow 443/tcp

# Allow HTTP (for Let's Encrypt)
ufw allow 80/tcp

# Allow LiveKit UDP (CRITICAL!)
ufw allow 51000:51100/udp

# Optional: Allow LiveKit TCP fallback
ufw allow 7881/tcp

# Optional: Allow direct LiveKit WebSocket (if not proxied)
ufw allow 7880/tcp
```

### What to Block
```bash
# Block direct PostgreSQL access from internet
ufw deny 5432/tcp

# Block Docker daemon
ufw deny 2375/tcp
ufw deny 2376/tcp

# Block unauthorized ports
ufw default deny incoming
ufw default allow outgoing
```

## DNS Configuration

Required DNS records:

```
# Main application
A     videowall.yourdomain.com    →  xxx.xxx.xxx.xxx (your server IP)

# LiveKit server
A     livekit.yourdomain.com      →  xxx.xxx.xxx.xxx (your server IP)

# Optional: Database (only if exposing, NOT recommended)
# A   db.yourdomain.com           →  xxx.xxx.xxx.xxx (your server IP)
```

## SSL/TLS Configuration

### Coolify Handles Automatically
```
videowall.yourdomain.com  →  Let's Encrypt SSL ✅
livekit.yourdomain.com    →  Let's Encrypt SSL ✅
```

### URL Schemes
```
Main App:    https://videowall.yourdomain.com  (HTTPS)
LiveKit WS:  wss://livekit.yourdomain.com      (WSS - secure WebSocket)
LiveKit UDP: No SSL (UDP doesn't support TLS)   (Direct UDP)
```

## Scaling Considerations

### Current Setup (Up to 60 churches)
```
Single Server:
  - PostgreSQL: 1 instance
  - LiveKit: 1 instance
  - Main App: 1 instance
  
Resources Needed:
  - CPU: 4+ cores
  - RAM: 8GB minimum
  - Network: 50+ Mbps upload
  - Storage: 20GB+
```

### Future Scaling (60+ churches)
```
Load Balanced Setup:
  - PostgreSQL: Primary + Replicas
  - LiveKit: Multiple instances (round-robin)
  - Main App: Multiple instances (load balanced)
  
Additional Components:
  - Load Balancer (Nginx/HAProxy)
  - Redis (for session sharing)
  - CDN (for static assets)
```

## Bandwidth Usage

### Per Church
```
Video: 240x180 @ 8fps = ~250 Kbps
Audio: Disabled = 0 Kbps
Total per church: ~300-500 Kbps (with overhead)
```

### Server Requirements
```
50 churches streaming:
  Upload: 50 × 0.5 Mbps = 25 Mbps
  
60 churches streaming:
  Upload: 60 × 0.5 Mbps = 30 Mbps

With overhead and safety margin:
  Recommended: 50+ Mbps upload
```

## Monitoring Points

### Health Checks
```
PostgreSQL:    docker ps | grep postgres
LiveKit:       curl https://livekit.yourdomain.com
Main App:      curl https://videowall.yourdomain.com
```

### Logs to Monitor
```
PostgreSQL:    docker logs postgres-container
LiveKit:       docker logs livekit-container
Main App:      docker logs videowall-container
```

### Metrics to Track
```
- Active connections (current churches streaming)
- Bandwidth usage (should not exceed 500 Kbps per church)
- CPU usage (should stay below 80%)
- Memory usage (should stay below 80%)
- Disk space (database grows over time)
```

## Backup Strategy

### What to Backup
```
1. PostgreSQL Database
   - Churches data
   - Services data
   - Sessions data
   
2. Environment Variables
   - All secrets and keys
   - Configuration settings
   
3. Configuration Files
   - docker-compose.livekit.yml
   - Dockerfile
   - livekit.yaml
```

### Backup Commands
```bash
# Database backup
docker exec postgres-container pg_dump -U user videowall > backup.sql

# Environment variables backup (manually document)
docker exec livekit-container env > livekit-env.txt
docker exec videowall-container env > app-env.txt

# Configuration backup (already in Git)
git pull origin main
```

---

**Quick Reference**: See `COOLIFY_CHECKLIST.md` for step-by-step deployment
**Full Guide**: See `COOLIFY_STANDALONE_DEPLOYMENT.md` for detailed instructions
**Troubleshooting**: See `COOLIFY_FIX_SUMMARY.md` for common issues
