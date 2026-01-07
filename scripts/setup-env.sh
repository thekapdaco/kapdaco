#!/bin/bash
# Environment Setup Script for Kapda Co.
# This script helps set up environment variables for development

set -e

echo "🚀 Kapda Co. - Environment Setup"
echo "================================"
echo ""

# Check if .env files already exist
if [ -f "backend/.env" ]; then
    echo "⚠️  backend/.env already exists. Skipping..."
else
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        echo "✅ Created backend/.env from env.example"
    else
        echo "❌ backend/env.example not found"
    fi
fi

if [ -f ".env" ]; then
    echo "⚠️  .env already exists. Skipping..."
else
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Created .env from env.example"
    else
        echo "❌ env.example not found"
    fi
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit backend/.env and add your MongoDB URI, JWT_SECRET, etc."
echo "2. Edit .env and set VITE_API_BASE_URL if needed"
echo "3. Generate JWT_SECRET: openssl rand -base64 32"
echo "4. Run: cd backend && npm run validate-env"
echo ""

