# Daily.co Integration Guide

You've signed up for Daily.co and tested it - great! Now let's integrate it into your app.

## Step 1: Install Daily.co Packages

```bash
cd /home/bryan/code/virtual-videowall
npm install @daily-co/daily-js @daily-co/daily-react
npm uninstall @livekit/components-react @livekit/components-styles livekit-client livekit-server-sdk
```

## Step 2: Set Environment Variables

Update your `.env` file (or set in Coolify):

```bash
# Remove these LiveKit variables:
# LIVEKIT_URL=...
# LIVEKIT_API_KEY=...
# LIVEKIT_API_SECRET=...
# NEXT_PUBLIC_LIVEKIT_URL=...

# Add Daily.co variables:
DAILY_API_KEY=your-api-key-from-dashboard
DAILY_DOMAIN=your-domain  # e.g., virtual-videowall
NEXT_PUBLIC_DAILY_DOMAIN=your-domain
```

Get these from: https://dashboard.daily.co/developers

## Step 3: Files Already Updated

I've already created/updated these files for you:

✅ `package.json` - Updated dependencies
✅ `lib/daily.ts` - Daily.co utility functions  
✅ `app/api/livekit/token/route.ts` - Updated to use Daily.co
✅ `components/church/church-room-daily.tsx` - New church component

## Step 4: Update Church Page

Replace the church page to use the new Daily.co component:

**File:** `app/church/page.tsx`

Find this import:
```typescript
import { ChurchRoom } from "@/components/church/church-room";
```

Replace with:
```typescript
import { ChurchRoom } from "@/components/church/church-room-daily";
```

Also update the API response handling to use `roomUrl` instead of `livekitUrl`.

## Step 5: Update Wall Display Component

The wall display needs a bigger rewrite. Here's a simplified approach:

**File:** `components/wall/wall-display-daily.tsx` (create new)

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { ChevronLeft, ChevronRight, Maximize, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WallDisplayProps {
  token: string;
  roomUrl: string;
  serviceName: string;
  sessionCode: string;
}

export function WallDisplay({ token, roomUrl, serviceName, sessionCode }: WallDisplayProps) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeCall = async () => {
      const daily = DailyIframe.createCallObject({
        videoSource: false, // Wall doesn't publish
        audioSource: false,
      });

      setCallObject(daily);

      daily
        .on("joined-meeting", () => {
          console.log("Wall: Joined meeting");
          updateParticipants(daily);
        })
        .on("participant-joined", () => updateParticipants(daily))
        .on("participant-updated", () => updateParticipants(daily))
        .on("participant-left", () => updateParticipants(daily));

      await daily.join({ url: roomUrl, token });
    };

    initializeCall();

    return () => {
      if (callObject) {
        callObject.destroy();
      }
    };
  }, [token, roomUrl]);

  const updateParticipants = (daily: DailyCall) => {
    const participants = Object.values(daily.participants())
      .filter((p) => !p.local && p.video)
      .sort((a, b) => (a.user_name || "").localeCompare(b.user_name || ""));
    setParticipants(participants);
  };

  const TILES_PER_PAGE = 20;
  const totalPages = Math.ceil(participants.length / TILES_PER_PAGE);
  const currentParticipants = participants.slice(
    currentPage * TILES_PER_PAGE,
    (currentPage + 1) * TILES_PER_PAGE
  );

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex-none bg-gray-800/50 px-6 py-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{participants.length} Churches Connected</span>
            </div>
            <div className="text-sm text-gray-300">{serviceName}</div>
          </div>

          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                variant="outline"
                size="sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden p-4" ref={containerRef}>
        {currentParticipants.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl">Waiting for churches to connect...</p>
            </div>
          </div>
        ) : (
          <div className="h-full grid grid-cols-4 grid-rows-5 gap-3">
            {currentParticipants.map((participant) => (
              <VideoTile
                key={participant.session_id}
                participant={participant}
                callObject={callObject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoTile({ participant, callObject }: { participant: any; callObject: DailyCall | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && callObject && participant.video) {
      const track = participant.tracks.video.track;
      if (track) {
        const stream = new MediaStream([track]);
        videoRef.current.srcObject = stream;
      }
    }
  }, [participant, callObject]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-sm font-medium truncate">
          {participant.user_name || "Unknown"}
        </p>
      </div>
    </div>
  );
}
```

## Step 6: Update Environment Variable Names

Since Daily.co doesn't use separate server/client URLs, simplify:

**In Coolify (or `.env`):**
```bash
# Daily.co Configuration
DAILY_API_KEY=your-api-key
DAILY_DOMAIN=virtual-videowall
NEXT_PUBLIC_DAILY_DOMAIN=virtual-videowall

# Database (same as before)
DATABASE_URL=postgresql://...

# NextAuth (same as before)
NEXTAUTH_URL=https://videowall.yourdomain.com
NEXTAUTH_SECRET=...

# Admin (same as before)
ADMIN_EMAIL=...
ADMIN_PASSWORD=...

# App (same as before)
NEXT_PUBLIC_APP_NAME=Virtual Video Wall
NEXT_PUBLIC_MAX_CHURCHES=60
```

## Step 7: Deploy Checklist

1. ✅ Run `npm install` to install Daily.co packages
2. ✅ Update `.env` or Coolify environment variables
3. ✅ Build the app: `npm run build`
4. ✅ Test locally: `npm run dev`
5. ✅ Deploy to Coolify (just 2 services: Database + App)

## Step 8: Test

1. Create a service in admin dashboard
2. Open church interface, enter session code
3. Allow camera access
4. Should connect and show video
5. Open wall display - should see the church

## Troubleshooting

### "DAILY_API_KEY is not set"
- Check environment variables in Coolify
- Ensure you've set `DAILY_API_KEY` from dashboard.daily.co

### "Failed to join room"
- Check `DAILY_DOMAIN` matches your Daily.co domain
- Check token is being generated correctly
- Check browser console for errors

### Video not showing
- Check camera permissions
- Check browser console for WebRTC errors
- Verify video quality settings (240x180 @ 8fps)

## Benefits vs LiveKit

✅ **FREE** - 10,000 minutes/month
✅ **Simpler** - No server to manage
✅ **No firewall** - All handled by Daily.co
✅ **No UDP ports** - No configuration needed
✅ **Reliable** - Enterprise infrastructure

## Next Steps

1. Run the installation command
2. Update environment variables
3. Test locally
4. Deploy to Coolify
5. Enjoy FREE video streaming! 🎉

---

**Need Help?**
- Daily.co Docs: https://docs.daily.co/
- Daily.co Support: https://help.daily.co/
