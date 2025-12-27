#!/bin/bash

# Winston Migration Cleanup Script
# This script deletes the obsolete custom Logger files

set -e

echo "🧹 Cleaning up obsolete custom Logger files..."

CUSTOM_LOGGER="src/server/services/llama/logger.ts"
LOGGER_TEST="__tests__/server/services/llama/logger.test.ts"

# Delete custom Logger class
if [ -f "$CUSTOM_LOGGER" ]; then
    echo "🗑️  Deleting custom Logger: $CUSTOM_LOGGER"
    rm "$CUSTOM_LOGGER"
    echo "   ✅ Deleted"
else
    echo "⚠️  Custom Logger not found: $CUSTOM_LOGGER"
fi

# Delete Logger test file
if [ -f "$LOGGER_TEST" ]; then
    echo "🗑️  Deleting Logger test: $LOGGER_TEST"
    rm "$LOGGER_TEST"
    echo "   ✅ Deleted"
else
    echo "⚠️  Logger test not found: $LOGGER_TEST"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "✅ Winston logger is now the single source of truth"
echo ""
echo "📋 Next steps:"
echo "   1. Run: pnpm dev"
echo "   2. Verify logs appear in terminal"
echo "   3. Check UI Logs page at http://localhost:3000/logs"
echo ""
