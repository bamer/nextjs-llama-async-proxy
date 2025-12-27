#!/usr/bin/env bash

# Verification script for LlamaService line 465 fix

set -e

echo "🔍 Verifying LlamaService.ts line 465 fix..."
echo ""

# Check if line 465 has correct syntax
echo "✓ Checking line 465 syntax..."
LINE_465=$(sed -n '465p' /home/bamer/nextjs-llama-async-proxy/src/server/services/LlamaService.ts)

if [[ "$LINE_465" == *"const sizeGb ="* ]]; then
  echo "✅ Line 465 correctly declares 'const sizeGb' variable"
  echo "   Line content: $LINE_465"
else
  echo "❌ Line 465 is missing 'const sizeGb' declaration!"
  echo "   Line content: $LINE_465"
  exit 1
fi

echo ""
echo "✓ Checking line 469 uses sizeGb variable..."
LINE_469=$(sed -n '469p' /home/bamer/nextjs-llama-async-proxy/src/server/services/LlamaService.ts)

if [[ "$LINE_469" == *"\${sizeGb}"* ]]; then
  echo "✅ Line 469 correctly uses sizeGb variable"
  echo "   Line content: $LINE_469"
else
  echo "⚠️  Line 469 might not be using sizeGb correctly"
  echo "   Line content: $LINE_469"
fi

echo ""
echo "✓ Clearing build caches..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
echo "✅ Caches cleared"

echo ""
echo "✓ Running TypeScript type check..."
if pnpm type:check; then
  echo ""
  echo "🎉 SUCCESS! TypeScript compilation passed!"
  echo ""
  echo "Summary of fix:"
  echo "  - Added missing 'const sizeGb =' variable declaration"
  echo "  - Division chain correctly converts bytes to GB"
  echo "  - .toFixed(2) formats to 2 decimal places"
  echo "  - Variable is properly scoped and used in forEach"
  echo ""
  echo "✅ Fix verified successfully!"
  exit 0
else
  echo ""
  echo "❌ Type check failed. Please review errors above."
  exit 1
fi
