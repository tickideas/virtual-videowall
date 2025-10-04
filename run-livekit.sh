#!/bin/bash

echo "🎥 Starting LiveKit Server..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing LiveKit container
docker rm -f videowall-livekit 2>/dev/null || true

# Run LiveKit in a simple configuration
docker run -d \
  --name videowall-livekit \
  --restart unless-stopped \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 50000-50020:50000-50020/udp \
  -v $(pwd)/livekit.yaml:/livekit.yaml:ro \
  livekit/livekit-server:latest \
  --config /livekit.yaml

echo "✅ LiveKit started!"
echo ""
echo "📊 Check status: docker logs videowall-livekit -f"
echo "🛑 Stop: docker stop videowall-livekit"
echo ""
echo "Testing connection..."
sleep 3
curl -s http://localhost:7880/ && echo "✅ LiveKit is responding!" || echo "⚠️  LiveKit not ready yet, give it a few seconds"
