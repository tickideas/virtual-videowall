# Changelog

## Changes Made (Latest Session)

### 1. ✅ Simplified Church Join Process
**Problem**: Admin had to create church codes for all churches (extra work)

**Solution**: Churches now only need to enter their name
- Removed church code requirement
- Churches auto-created on first join
- Name is displayed on video wall
- Admin work reduced significantly

**Files Changed**:
- `components/church/church-join-form.tsx` - Changed from code to name input
- `app/api/session/join/route.ts` - Auto-create churches by name
- `app/api/livekit/token/route.ts` - Find/create by name

### 2. ✅ Fixed Next.js 15 Async Params Error
**Problem**: `params.sessionCode` needed to be awaited in Next.js 15

**Solution**: Updated route handler to await params
- `app/api/service/[sessionCode]/route.ts` - Added `await params`

### 3. ✅ Fixed LiveKit Token Generation
**Problem**: Token was async but not awaited

**Solution**: Made token generation properly async
- `lib/livekit.ts` - Made function async with proper await
- `app/api/livekit/token/route.ts` - Await token generation

### 4. ✅ Fixed LiveKit Component Issues
**Problem**: Incompatible LiveKit component APIs

**Solution**: Updated to correct LiveKit v2 APIs
- `components/church/church-room.tsx` - Fixed video preview
- `components/wall/video-tile.tsx` - Fixed participant track access

### 5. ✅ Fixed Docker Configuration
**Problem**: LiveKit container stuck on startup

**Solution**: 
- Simplified `livekit.yaml` configuration
- Reduced UDP port range (50000-50020 instead of 50000-60000)
- Created helper scripts (`run-livekit.sh`, `status.sh`)

## Known Issues

### 1. ⚠️ Disconnect After Few Minutes
**Symptoms**: Church connects, then disconnects after a few minutes

**Possible Causes**:
- LiveKit token expiry (currently 24h, should be sufficient)
- Network timeout
- Browser/tab going to sleep
- WebRTC connection issues

**Debugging Steps**:
1. Check browser console for errors
2. Check LiveKit server logs: `docker logs videowall-livekit -f`
3. Monitor network tab in DevTools
4. Test with stable internet connection

**Potential Fixes** (to implement):
- Add auto-reconnect logic on disconnect
- Increase LiveKit timeout settings
- Add keep-alive ping mechanism
- Handle browser visibility API

### 2. ⚠️ `getTrackPublication is not a function`
**Status**: May still occur sporadically

**Fix Applied**: Added try-catch and safer track access in VideoTile

**If still occurs**:
- Check browser console for full error
- Verify LiveKit client version compatibility
- May need to update `@livekit/components-react` version

## Current System Status

✅ **Working**:
- PostgreSQL database
- LiveKit server
- Admin login and dashboard
- Service creation
- Church name-based join (simplified!)
- Token generation
- API endpoints

⚠️ **Needs Testing**:
- Long-duration connections (>5 minutes)
- Network reconnection
- Multiple simultaneous churches
- Mobile device compatibility

## Next Steps (Recommended Priority)

### High Priority
1. **Test disconnect issue**:
   - Join as church and stay connected for 10+ minutes
   - Monitor logs for errors
   - Implement auto-reconnect if needed

2. **Add reconnection logic**:
```typescript
// In ChurchRoom component
onDisconnected={() => {
  console.log('Disconnected, attempting to reconnect...');
  // Try to reconnect
}}
```

3. **Test with multiple churches**:
   - Open 3-5 church tabs
   - Verify all appear on wall
   - Check performance

### Medium Priority
4. **Mobile testing**:
   - Test on iPhone/Android
   - Verify camera access
   - Check video quality

5. **Performance optimization**:
   - Monitor bandwidth usage
   - Test with 20+ churches
   - Verify pagination works

6. **Production deployment**:
   - Follow DEPLOYMENT.md
   - Deploy to Coolify
   - Setup domain and SSL

### Low Priority
7. **UI improvements**:
   - Better error messages
   - Loading states
   - Connection quality indicators

8. **Admin features**:
   - View active connections
   - Force disconnect church
   - Session history

## Testing Checklist

### Basic Flow
- [ ] Admin creates service
- [ ] Church joins with name only (no code needed!)
- [ ] Church video appears on wall
- [ ] Connection stays stable for 10+ minutes
- [ ] Church can leave and rejoin
- [ ] Multiple churches can connect simultaneously

### Edge Cases
- [ ] Invalid service code
- [ ] Duplicate church names
- [ ] Network interruption recovery
- [ ] Browser tab minimized/hidden
- [ ] Mobile device compatibility

## Documentation Updates Needed

- [ ] Update QUICKSTART.md (church code → church name)
- [ ] Update README.md (simplified flow)
- [ ] Update AGENTS.md (API changes)
- [ ] Add troubleshooting guide

## Performance Notes

**Current Configuration**:
- Video: 240x180 @ 8fps = ~300-400 Kbps per church
- Wall: 20 churches per page = 6-8 Mbps
- LiveKit: UDP ports 50000-50020 (21 ports)

**Recommendations**:
- For 60+ churches: Increase UDP port range
- For better quality: Adjust `livekit.yaml` video settings
- For slower networks: Reduce to 180p @ 6fps

## Quick Commands

```bash
# Check system status
./status.sh

# View LiveKit logs
docker logs videowall-livekit -f

# Restart LiveKit
docker restart videowall-livekit

# Check database
docker exec videowall-postgres psql -U videowall -d videowall -c "SELECT name FROM \"Church\";"

# Reset everything
./reset-docker.sh
docker-compose -f docker-compose.simple.yml up -d
./run-livekit.sh
npm run dev
```

## Contact/Support

For issues, check:
1. Browser console (`F12`)
2. Terminal logs (where `npm run dev` runs)
3. Docker logs (`docker logs videowall-livekit`)
4. Database (`npm run db:studio`)

---

**Last Updated**: 2025-01-04
**Version**: 0.2.0 (Simplified church join)
