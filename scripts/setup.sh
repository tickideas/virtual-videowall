#!/bin/bash

echo "🚀 Virtual Video Wall - Quick Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate secrets
    echo "🔐 Generating secure secrets..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    LIVEKIT_API_KEY="LK$(openssl rand -hex 8)"
    LIVEKIT_API_SECRET=$(openssl rand -base64 32)
    
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|NEXTAUTH_SECRET=\"generate-with-openssl-rand-base64-32\"|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env
        sed -i '' "s|LIVEKIT_API_KEY=\"devkey\"|LIVEKIT_API_KEY=\"$LIVEKIT_API_KEY\"|g" .env
        sed -i '' "s|LIVEKIT_API_SECRET=\"secret\"|LIVEKIT_API_SECRET=\"$LIVEKIT_API_SECRET\"|g" .env
    else
        # Linux
        sed -i "s|NEXTAUTH_SECRET=\"generate-with-openssl-rand-base64-32\"|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env
        sed -i "s|LIVEKIT_API_KEY=\"devkey\"|LIVEKIT_API_KEY=\"$LIVEKIT_API_KEY\"|g" .env
        sed -i "s|LIVEKIT_API_SECRET=\"secret\"|LIVEKIT_API_SECRET=\"$LIVEKIT_API_SECRET\"|g" .env
    fi
    
    echo "✅ .env file created with secure secrets"
    echo ""
    echo "⚠️  IMPORTANT: Update these values in .env:"
    echo "   - DATABASE_URL (if not using Docker Compose)"
    echo "   - LIVEKIT_URL (if not using Docker Compose)"
    echo "   - NEXT_PUBLIC_LIVEKIT_URL (must be publicly accessible)"
    echo ""
    read -p "Press enter to continue..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Generating Prisma client..."
npm run db:generate

echo ""
echo "📊 Database setup..."
read -p "Do you want to setup the database now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Pushing database schema..."
    npm run db:push
    
    echo ""
    echo "🌱 Seeding database..."
    npm run db:seed
    
    echo ""
    echo "✅ Database setup completed!"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Start Docker Compose (PostgreSQL + LiveKit):"
echo "      docker-compose up -d"
echo ""
echo "   2. Start development server:"
echo "      npm run dev"
echo ""
echo "   3. Visit http://localhost:3000"
echo ""
echo "   4. Login to admin with:"
echo "      Email: admin@example.com"
echo "      Password: admin123"
echo ""
echo "   ⚠️  Change the admin password after first login!"
echo ""
