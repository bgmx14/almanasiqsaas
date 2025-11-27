#!/bin/bash
# Cloudflare Pages build script for pnpm monorepo

set -e

echo "🔧 OmraFlow Pro - Cloudflare Pages Build Script"
echo "================================================"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@8.15.0
fi

echo "✅ pnpm version: $(pnpm --version)"

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install --frozen-lockfile

# Build only the web app
echo "🏗️  Building web app..."
pnpm run build:web

echo "✅ Build complete!"
