#!/bin/bash

# Deployment script for EC2
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please copy .env.example to .env and fill in the values."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data/exports

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing...${NC}"
    npm install -g pm2
fi

# Stop existing PM2 process if running
if pm2 list | grep -q "zalo-bot-oa"; then
    echo "🛑 Stopping existing PM2 process..."
    pm2 stop zalo-bot-oa || true
    pm2 delete zalo-bot-oa || true
fi

# Start with PM2
echo "🚀 Starting application with PM2..."
# Try ecosystem config first, fallback to direct path if fails
if ! pm2 start ecosystem.config.js 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Ecosystem config failed, using direct path...${NC}"
    pm2 start src/index.js --name zalo-bot-oa
fi

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check app status"
echo "  pm2 logs zalo-bot-oa     - View logs"
echo "  pm2 restart zalo-bot-oa  - Restart app"
echo ""
echo "To setup PM2 to start on system boot, run:"
echo "  pm2 startup"
echo "  (Then run the command that PM2 suggests)"

