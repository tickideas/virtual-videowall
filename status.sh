#!/bin/bash

echo "🔍 Virtual Video Wall - System Status"
echo "======================================="
echo ""

# Check PostgreSQL
if docker ps | grep -q videowall-postgres; then
    echo "✅ PostgreSQL: Running"
    echo "   Port: 5432"
else
    echo "❌ PostgreSQL: Not running"
    echo "   Start with: docker-compose -f docker-compose.simple.yml up -d"
fi

echo ""

# Check Redis
if docker ps | grep -q videowall-redis; then
    echo "✅ Redis: Running"
    echo "   Port: 6379"
else
    echo "⚠️  Redis: Not running"
    echo "   Start with: docker compose up -d redis"
fi

echo ""

# Check if Next.js is running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Next.js App: Running"
    echo "   URL: http://localhost:3000"
else
    echo "⏸️  Next.js App: Not running"
    echo "   Start with: npm run dev"
fi

echo ""
echo "======================================="
echo ""

# Database check
echo "📊 Database Status:"
if docker exec videowall-postgres pg_isready -U videowall > /dev/null 2>&1; then
    echo "   ✅ Database connection OK"
else
    echo "   ❌ Database connection failed"
fi

echo ""
echo "🔑 Default Credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "📝 Sample Church Codes: ABC123, DEF456, GHI789"
echo ""
