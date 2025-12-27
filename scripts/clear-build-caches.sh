#!/bin/bash
set -e

echo "🧹 Clearing all build caches..."

# Clear Next.js build cache
if [ -d ".next" ]; then
  echo "  Removing .next directory..."
  rm -rf .next
fi

# Clear Vite cache
if [ -d "node_modules/.vite" ]; then
  echo "  Removing node_modules/.vite directory..."
  rm -rf node_modules/.vite
fi

# Clear general node modules cache
if [ -d "node_modules/.cache" ]; then
  echo "  Removing node_modules/.cache directory..."
  rm -rf node_modules/.cache
fi

# Clear .tsbuildinfo if exists
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

echo "✅ All caches cleared successfully!"
echo ""
echo "Running TypeScript type check..."
pnpm type:check
