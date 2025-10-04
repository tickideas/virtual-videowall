# Coolify LiveKit Deployment Fix

## Problem
LiveKit container was failing with error:
```
one of key-file or keys must be provided
```

## Root Cause
The `keys` section in the dynamically generated `livekit.yaml` wasn't being properly formatted. Environment variable substitution wasn't working correctly in the inline YAML generation.

## Solution Applied

### 1. Fixed docker-compose.livekit.yml
Updated the file to:
- Use `$$` to escape variables in heredoc for proper shell expansion
- Add explicit `environment` section with default values
- Simplified YAML generation (removed extra blank lines that could cause parsing issues)

### 2. Environment Variables Required in Coolify

Add these to your Coolify service environment variables:

```bash
LIVEKIT_API_KEY=LK41e534fcd2edbeb7
LIVEKIT_API_SECRET=34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg=
```

⚠️ **For Production**: Generate new keys!
```bash
# API Key (must start with LK)
echo "LK$(openssl rand -hex 16)"

# API Secret
openssl rand -base64 32
```

## How to Deploy

### Step 1: Commit Changes
```bash
git add docker-compose.livekit.yml
git commit -m "fix: add environment variable support for LiveKit keys"
git push origin main
```

### Step 2: Configure Coolify

1. Go to your LiveKit service in Coolify
2. Navigate to **Environment Variables**
3. Add both variables:
   - `LIVEKIT_API_KEY` = `LK41e534fcd2edbeb7`
   - `LIVEKIT_API_SECRET` = `34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg=`
4. **Save** the configuration

### Step 3: Redeploy

Click **Deploy** in Coolify. The container should now start successfully.

### Step 4: Verify

Check the logs in Coolify:
```
✅ Should see: "starting LiveKit server..."
✅ Should NOT see: "one of key-file or keys must be provided"
```

## Testing the Fix Locally

```bash
cd /home/bryan/code/virtual-videowall

# Set environment variables
export LIVEKIT_API_KEY=LK41e534fcd2edbeb7
export LIVEKIT_API_SECRET="34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg="

# Start LiveKit
docker-compose -f docker-compose.livekit.yml up -d

# Check logs
docker-compose -f docker-compose.livekit.yml logs -f

# Test connection
curl http://localhost:7880
# Should return: OK

# Clean up
docker-compose -f docker-compose.livekit.yml down
```

## What Changed in docker-compose.livekit.yml

**Before:**
```yaml
keys:
  LK41e534fcd2edbeb7: "34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg="
```
Hardcoded keys, no environment variable support.

**After:**
```yaml
environment:
  - LIVEKIT_API_KEY=${LIVEKIT_API_KEY:-LK41e534fcd2edbeb7}
  - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET:-34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg=}

command: >
  sh -c '
  cat > /livekit.yaml << EOF
  keys:
    $${LIVEKIT_API_KEY}: "$${LIVEKIT_API_SECRET}"
  EOF
  livekit-server --config /livekit.yaml
  '
```
Now reads from environment variables with fallback defaults.

## Additional Configuration for Your Main App

Make sure your main application service also has these variables:

```bash
# Server-side (internal Docker network)
LIVEKIT_URL=ws://livekit:7880
LIVEKIT_API_KEY=LK41e534fcd2edbeb7
LIVEKIT_API_SECRET=34VbPa4AuiBsVvThn9mKUH+gJ3Ugs9FXPznSsI3ThXg=

# Client-side (publicly accessible)
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
```

## Network Requirements

Ensure these ports are accessible:
- **7880** - WebSocket/HTTP (can be proxied)
- **7881** - TCP fallback
- **51000-51100/udp** - RTC media (must be directly accessible, cannot be proxied)

## Security Notes

1. **Change the default keys** before going to production
2. **Never commit** `.env` files with real credentials
3. **Use strong secrets** for NEXTAUTH_SECRET and database passwords
4. **Enable HTTPS** - Cameras require secure context (HTTPS)
5. **Firewall** - Only open required ports

## Troubleshooting

### Still seeing "keys must be provided"?
```bash
# Check if env vars are set in container
docker exec <container-name> env | grep LIVEKIT

# Check generated config
docker exec <container-name> cat /livekit.yaml

# Should show your keys, not ${LIVEKIT_API_KEY}
```

### Container starts but clients can't connect?
1. Verify `NEXT_PUBLIC_LIVEKIT_URL` is publicly accessible
2. Check WebSocket connection: `wscat -c wss://livekit.yourdomain.com`
3. Ensure UDP ports 51000-51100 are open in firewall
4. Check reverse proxy supports WebSocket upgrades

### "Invalid token" errors?
1. Keys must match exactly between LiveKit server and application
2. No extra whitespace in environment variables
3. Check for special characters that need escaping

## Next Steps

1. ✅ Commit and push changes
2. ✅ Add environment variables in Coolify
3. ✅ Redeploy service
4. ✅ Verify logs show successful startup
5. ✅ Test connection with `curl http://your-livekit-url`
6. 🔒 Generate production keys
7. 📝 Document your production environment variables
8. 🧪 Test end-to-end with church interface

## Support

Full deployment guide: See `COOLIFY_DEPLOYMENT.md`
Project documentation: See `SPEC.md` and `DEPLOYMENT.md`
