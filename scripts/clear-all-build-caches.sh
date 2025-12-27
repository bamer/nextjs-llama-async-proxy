#!/usr/bin/env bash

# Clear all build caches for Next.js, Vite, and TypeScript
# This helps resolve persistent esbuild/parser issues

set -e

echo "🧹 Clearing ALL build caches..."
echo ""

# Clear Next.js build cache
if [ -d ".next" ]; then
  echo "  🗑️  Removing .next directory..."
  rm -rf .next
  echo "     ✅ .next removed"
else
  echo "  ℹ️  .next directory not found (already clean)"
fi

# Clear Vite cache (if present)
if [ -d "node_modules/.vite" ]; then
  echo "  🗑️  Removing node_modules/.vite directory..."
  rm -rf node_modules/.vite
  echo "     ✅ node_modules/.vite removed"
else
  echo "  ℹ️  node_modules/.vite not found (already clean)"
fi

# Clear general node_modules cache
if [ -d "node_modules/.cache" ]; then
  echo "  🗑️  Removing node_modules/.cache directory..."
  rm -rf node_modules/.cache
  echo "     ✅ node_modules/.cache removed"
else
  echo "  ℹ️  node_modules/.cache not found (already clean)"
fi

# Clear TypeScript build info files
echo "  🗑️  Removing TypeScript build info files..."
TSBUILDINFO_COUNT=$(find . -name "*.tsbuildinfo" -type f 2>/dev/null | wc -l)
if [ "$TSBUILDINFO_COUNT" -gt 0 ]; then
  find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
  echo "     ✅ Removed $TSBUILDINFO_COUNT .tsbuildinfo file(s)"
else
  echo "     ℹ️  No .tsbuildinfo files found"
fi

# Clear Turbo/Next.js TurboPack cache if present
if [ -d ".turbo" ]; then
  echo "  🗑️  Removing .turbo directory..."
  rm -rf .turbo
  echo "     ✅ .turbo removed"
else
  echo "  ℹ️  .turbo directory not found (already clean)"
fi

echo ""
echo "✅ All build caches cleared successfully!"
echo ""
echo "Next steps:"
echo "  1. Run type check:   pnpm type:check"
echo "  2. Start dev server: pnpm dev"
echo ""
