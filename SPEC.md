# Virtual Video Wall - Technical Specification

## Overview

A virtual video wall platform enabling 50-60 churches to simultaneously connect via video during monthly zonal meetings. Optimized for low-bandwidth environments (300-500 Kbps).

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15 (App Router)
- **Rendering**: Client-side for real-time features, Server Components for admin
- **State Management**: React hooks + LiveKit state
- **Styling**: Tailwind CSS with custom theme

### Backend Architecture
- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Cookie-based sessions (simplified NextAuth)
- **WebRTC**: Self-hosted LiveKit server

### WebRTC Architecture
- **SFU**: LiveKit with Selective Forwarding Unit
- **Codec**: VP8 for broad compatibility
- **Simulcast**: 2 layers (low: 240x180, medium: 320x240)
- **Adaptive Bitrate**: Dynamic quality adjustment

## Database Schema

```prisma
model Church {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique  // 6-digit code
  location  String?
  sessions  Session[]
}

model Service {
  id          String   @id @default(cuid())
  name        String
  sessionCode String   @unique  // 6-digit code
  startTime   DateTime
  endTime     DateTime?
  active      Boolean  @default(false)
  maxChurches Int      @default(60)
  sessions    Session[]
}

model Session {
  id                String   @id
  churchId          String
  serviceId         String
  joinedAt          DateTime @default(now())
  leftAt            DateTime?
  isActive          Boolean  @default(true)
  avgBandwidth      Int?     // Kbps
  connectionQuality String?  // excellent/good/poor
}

model User {
  id       String @id @default(cuid())
  email    String @unique
  password String
  name     String?
  role     String @default("admin")
}
```

## API Endpoints

### Public Endpoints

#### POST /api/livekit/token
Generate LiveKit access token for church or wall viewer.

**Request:**
```json
{
  "sessionCode": "ABC123",
  "churchCode": "XYZ789",
  "participantType": "church" | "viewer"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "roomName": "service-id",
  "serviceName": "Monthly Meeting",
  "livekitUrl": "ws://..."
}
```

#### POST /api/session/join
Church joins a service session.

**Request:**
```json
{
  "sessionCode": "ABC123",
  "churchCode": "XYZ789"
}
```

**Response:**
```json
{
  "success": true,
  "session": {...},
  "church": {...},
  "service": {...}
}
```

#### GET /api/service/[sessionCode]
Get service details and active churches.

**Response:**
```json
{
  "service": {
    "id": "...",
    "name": "...",
    "sessions": [...]
  },
  "activeChurches": 23
}
```

### Admin Endpoints

#### GET /api/admin/churches
List all churches.

#### POST /api/admin/churches
Create a new church.

#### GET /api/admin/services
List all services.

#### POST /api/admin/services
Create a new service.

## LiveKit Configuration

### Optimal Settings for 50-60 Streams

```yaml
room:
  max_participants: 65
  empty_timeout: 300
  
video:
  simulcast_layers:
    - quality: low
      width: 240
      height: 180
      bitrate: 250000  # 250 Kbps
      framerate: 8
    - quality: medium
      width: 320
      height: 240
      bitrate: 350000  # 350 Kbps
      framerate: 10

audio:
  enabled: false  # Audio disabled by default
```

### Church Client Options

```typescript
{
  videoCaptureDefaults: {
    resolution: { width: 240, height: 180 },
    frameRate: 8,
  },
  audioCaptureDefaults: {
    autoGainControl: false,
    echoCancellation: false,
    noiseSuppression: false,
  },
  adaptiveStream: true,
  dynacast: true,
}
```

### Wall Display Options

```typescript
{
  videoQuality: 'low',  // Subscribe to lowest layer
  audio: false,         // Don't subscribe to audio
}
```

## Bandwidth Calculations

### Per Church
- Video bitrate: 250-350 Kbps
- Audio: 0 Kbps (disabled)
- WebRTC overhead: ~50 Kbps
- **Total: 300-400 Kbps upload**

### Wall Display (Paginated - 20 churches)
- 20 streams × 300 Kbps = 6 Mbps
- Overhead: ~1 Mbps
- **Total: 7-8 Mbps download**

### Server Requirements
- 60 churches × 350 Kbps = 21 Mbps upload
- Wall viewers × 8 Mbps = varies
- **Recommended: 100 Mbps symmetric**

## User Flows

### Church Join Flow

1. Navigate to `/church`
2. Enter session code (6 digits)
3. Enter church code (6 digits)
4. API validates codes
5. Request camera permissions
6. Preview video (240x180 @ 8fps)
7. Click "Go Live"
8. Connect to LiveKit room
9. Display connection status

### Wall Display Flow

1. Navigate to `/wall`
2. Enter session code
3. Fetch service details
4. Generate viewer token
5. Connect to LiveKit room
6. Display paginated grid (20 per page)
7. Auto-navigate pages every 30s (optional)
8. Show church names and connection status

### Admin Flow

1. Login at `/admin`
2. View dashboard with stats
3. **Manage Churches:**
   - Add church with name and location
   - System generates unique 6-digit code
   - Display code to share with church
4. **Manage Services:**
   - Create service with name and datetime
   - System generates unique session code
   - Set max churches (default: 60)
   - Mark as active
5. Share session code with churches
6. Monitor live connections

## Security Considerations

### Authentication
- Admin uses cookie-based sessions
- Churches use unique codes (no accounts)
- LiveKit tokens expire after service ends

### Authorization
- Churches can only publish video
- Wall viewers can only subscribe
- Admin routes protected by session check

### Data Privacy
- No video recording by default
- Sessions auto-cleanup after 24h
- Minimal PII collected

## Performance Optimizations

### Frontend
- Paginated rendering (20 tiles max)
- Virtual scrolling for participant list
- Lazy loading of components
- Optimistic updates for admin actions

### Backend
- Database connection pooling
- Indexed queries on sessionCode
- Caching of active services
- Batch updates for session status

### Network
- VP8 codec (better compression)
- Simulcast with 2 layers
- Dynacast (only send to active subscribers)
- UDP for RTC, TCP fallback

## Error Handling

### Network Failures
- Auto-reconnect with exponential backoff
- Show connection status to user
- Graceful degradation (lower quality)

### Capacity Limits
- Prevent join if maxChurches reached
- Queue system for overflow (future)
- Admin notification on capacity

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: WebRTC quirks handled
- Mobile: Tested on iOS/Android

## Monitoring & Logging

### Key Metrics
- Active churches per service
- Average bandwidth per church
- Connection quality distribution
- Session duration

### Logging
- API errors to console
- LiveKit errors to file
- Admin actions logged
- Session join/leave events

## Future Enhancements

1. **Recording**: Optional service recording
2. **Chat**: Text chat between churches
3. **Analytics**: Detailed connection reports
4. **Multi-language**: Internationalization
5. **TURN Server**: For strict NAT traversal
6. **Mobile Apps**: Native iOS/Android apps

## Deployment Requirements

### Minimum Server (50-60 churches)
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Bandwidth**: 100 Mbps (500GB/month)
- **OS**: Ubuntu 22.04 LTS

### Recommended Providers
- Hetzner (Europe) - €40/month
- DigitalOcean - $48/month
- Vultr - $48/month

## Cost Estimation

### Self-Hosted (Coolify)
- Server: $40-50/month
- Domain: $1/month
- Backups: $5/month
- **Total: ~$50/month**

### Cloud Alternative (LiveKit Cloud)
- LiveKit: $300-500/month
- Vercel: $20/month
- PostgreSQL: Free tier
- **Total: ~$350-550/month**

**Savings: $300-500/month with self-hosting**
