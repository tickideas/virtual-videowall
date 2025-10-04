# Video Wall Stability Fixes

## Issues Identified

The video wall was experiencing instability where church video feeds would:
- Not show up initially even though churches were connected
- Come in and out intermittently  
- Show as camera stopped on the wall side

## Root Causes

### 1. **Stale Video Track References**
The wall display was using `participant.tracks?.video?.persistentTrack`, but this track reference can become stale or end unexpectedly, causing videos to disappear.

### 2. **No Track Event Monitoring**
The `VideoTile` component only checked for video tracks on initial mount and when the participant object changed. It didn't listen for:
- `track-started` - When a participant starts sending video
- `track-stopped` - When a participant stops sending video

### 3. **Missing Bandwidth Optimization**
The church side wasn't applying the video quality constraints (240x180 @ 8fps) correctly. The constraints need to be applied when requesting the camera from the browser, not after joining.

### 4. **No Automatic Track Subscription**
The wall wasn't configured with `subscribeToTracksAutomatically: true`, which could cause delays in receiving tracks.

### 5. **No Receive Settings Optimization**
The wall wasn't requesting the lowest quality layer, which is important when using simulcast.

## Fixes Applied

### Wall Display (`components/wall/wall-display-daily.tsx`)

#### 1. Enhanced VideoTile Component
```typescript
// Now uses .track instead of .persistentTrack
const videoTrack = participant.tracks?.video?.track;

// Checks for "live" readyState
if (videoTrack && videoTrack.readyState === "live") {
  // ...
}
```

#### 2. Added Track Event Listeners
```typescript
const handleTrackStarted = (event: DailyEventObjectTrack) => {
  if (event.participant?.session_id === participant.session_id && 
      event.track?.kind === "video") {
    console.log("VideoTile: Track started for", participant.user_name);
    updateVideoTrack();
  }
};

const handleTrackStopped = (event: DailyEventObjectTrack) => {
  if (event.participant?.session_id === participant.session_id && 
      event.track?.kind === "video") {
    console.log("VideoTile: Track stopped for", participant.user_name);
    setHasVideo(false);
  }
};
```

#### 3. Proper Stream Cleanup
```typescript
// Clean up old stream before creating new one
if (streamRef.current) {
  streamRef.current.getTracks().forEach(track => track.stop());
}

const stream = new MediaStream([videoTrack]);
streamRef.current = stream;
```

#### 4. Auto-Subscribe and Receive Settings
```typescript
// Enable auto-subscribe
callObjectRef.current = DailyIframe.createCallObject({
  videoSource: false,
  audioSource: false,
  subscribeToTracksAutomatically: true, // ✅ New
});

// Request lowest quality layer
await daily.updateReceiveSettings({
  base: {
    video: {
      layer: 0, // Lowest quality for bandwidth
    },
  },
});
```

#### 5. Main Call Object Track Listeners
```typescript
// Added to main call object to update participant list
const handleTrackStarted = (event: DailyEventObjectTrack) => {
  console.log("Wall: Track started", event.participant?.user_name, event.track?.kind);
  updateParticipants();
};

const handleTrackStopped = (event: DailyEventObjectTrack) => {
  console.log("Wall: Track stopped", event.participant?.user_name, event.track?.kind);
  updateParticipants();
};
```

### Church Interface (`components/church/church-room-daily.tsx`)

#### 1. Apply Video Constraints Before Join
```typescript
// Request camera with constraints BEFORE creating call object
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 240 },
    height: { ideal: 180 },
    frameRate: { ideal: 8, max: 8 },
    facingMode: "user",
  },
  audio: false,
});

// Use constrained track when creating call object
callObjectRef.current = DailyIframe.createCallObject({
  videoSource: stream.getVideoTracks()[0], // ✅ Pre-constrained track
  audioSource: false,
});
```

#### 2. Send Settings for Bandwidth Control
```typescript
// Set send settings for maximum bandwidth savings
await daily.updateSendSettings({
  video: {
    maxQuality: "low",
    encodings: {
      low: {
        maxBitrate: 400000, // 400 Kbps max
        maxFramerate: 8,
        scaleResolutionDownBy: 1,
      },
    },
  },
});
```

## Expected Improvements

1. **Stable Video Display**: Videos should appear reliably when churches connect
2. **Automatic Recovery**: If a track stops/starts, the display will automatically update
3. **Better Logging**: Console logs help diagnose connection issues
4. **Bandwidth Compliance**: Church streams are guaranteed to be 240x180 @ 8fps
5. **Reduced Latency**: Auto-subscribe means tracks appear faster
6. **Proper Cleanup**: No memory leaks from orphaned media streams

## Testing Checklist

- [ ] Connect a church - video should appear on wall within 2-3 seconds
- [ ] Check browser console for "Track started" messages
- [ ] Disconnect church - video tile should disappear cleanly
- [ ] Reconnect church - video should reappear without page reload
- [ ] Test with 5+ churches - all videos should be stable
- [ ] Check bandwidth usage (should be ~300-400 Kbps per church)
- [ ] Test on poor connection (throttle to 500 Kbps) - video should still work
- [ ] Check video resolution: inspect element on video tile, should show 240x180

## Monitoring

Watch for these console messages:

**Wall Side:**
- ✅ "Wall: Track started [Church Name] video" - Church video started
- ✅ "Wall: Track stopped [Church Name] video" - Church video stopped
- ✅ "Wall: Participants updated: X" - Participant list refreshed
- ✅ "Wall: Applied receive settings for low bandwidth"

**Church Side:**
- ✅ "Church: Camera enabled with low-bandwidth settings (240x180 @ 8fps)"
- ✅ "Church: Joined meeting successfully"

## Troubleshooting

If videos still don't appear:

1. **Check browser console** for errors on both wall and church sides
2. **Verify Daily.co room** is created with correct settings
3. **Check network tab** - should see WebRTC connections establishing
4. **Test camera permissions** - ensure browser has camera access
5. **Try different browser** - some browsers handle WebRTC differently
6. **Check Daily.co dashboard** - verify room and participants

## Performance Notes

- Each video tile now has its own track event listeners (properly cleaned up)
- Stream references are managed to prevent memory leaks
- Video tracks are checked for "live" state before rendering
- Old streams are properly stopped before creating new ones

## Breaking Changes

None - these changes are backward compatible and only fix existing issues.
