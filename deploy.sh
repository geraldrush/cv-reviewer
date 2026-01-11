#!/bin/bash

echo "🚀 CV Reviewer Deployment Script"
echo "================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Create .env with:"
    echo "OPENAI_API_KEY=your_key_here"
    echo "PORT=3000"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the app
echo "🔨 Building application..."
npm run build

# Check which deployment option
echo ""
echo "Choose deployment option:"
echo "1) Fly.io (Recommended)"
echo "2) Railway"
echo "3) Local production"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🚁 Deploying to Fly.io..."
        if ! command -v fly &> /dev/null; then
            echo "Installing Fly CLI..."
            curl -L https://fly.io/install.sh | sh
        fi
        fly launch --no-deploy
        fly secrets set OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d '=' -f2)
        fly deploy
        ;;
    2)
        echo "🚂 Deploying to Railway..."
        if ! command -v railway &> /dev/null; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        railway login
        railway init
        railway up
        ;;
    3)
        echo "🏠 Starting local production server..."
        NODE_ENV=production npm start
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo "✅ Deployment complete!"