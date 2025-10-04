#!/bin/bash

echo "🔄 Resetting Docker containers..."
echo ""

# Kill any stuck docker-compose processes
pkill -f "docker-compose" || true

# Force remove containers
docker rm -f videowall-livekit videowall-postgres videowall-app 2>/dev/null || true

# Remove networks
docker network rm virtual-videowall_default 2>/dev/null || true

echo "✅ Reset complete!"
echo ""
echo "Next steps:"
echo "1. Start PostgreSQL: docker-compose -f docker-compose.simple.yml up -d"
echo "2. Start LiveKit: ./run-livekit.sh"
echo "3. Start app: npm run dev"
