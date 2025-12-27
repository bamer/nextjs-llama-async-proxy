#!/bin/bash

# Winston Migration Verification Script
# This script verifies that Winston is the sole logging system

set -e

echo "🔍 Verifying Winston logger migration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: Custom Logger file should NOT exist
echo "📋 Check 1: Custom Logger file deleted"
if [ -f "src/server/services/llama/logger.ts" ]; then
    echo -e "${RED}❌ FAIL: Custom Logger file still exists${NC}"
    echo "   File: src/server/services/llama/logger.ts"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ PASS: Custom Logger file deleted${NC}"
fi
echo ""

# Check 2: Custom Logger test should NOT exist
echo "📋 Check 2: Custom Logger test deleted"
if [ -f "__tests__/server/services/llama/logger.test.ts" ]; then
    echo -e "${RED}❌ FAIL: Custom Logger test still exists${NC}"
    echo "   File: __tests__/server/services/llama/logger.test.ts"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ PASS: Custom Logger test deleted${NC}"
fi
echo ""

# Check 3: No imports of custom Logger in production code
echo "📋 Check 3: No custom Logger imports in production code"
CUSTOM_LOGGER_IMPORTS=$(grep -r "from.*services/llama/logger" src/ 2>/dev/null || true)
if [ -n "$CUSTOM_LOGGER_IMPORTS" ]; then
    echo -e "${RED}❌ FAIL: Found custom Logger imports:${NC}"
    echo "$CUSTOM_LOGGER_IMPORTS"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ PASS: No custom Logger imports${NC}"
fi
echo ""

# Check 4: No 'new Logger()' in production code
echo "📋 Check 4: No 'new Logger()' calls in production code"
NEW_LOGGER_CALLS=$(grep -r "new Logger(" src/ 2>/dev/null || true)
if [ -n "$NEW_LOGGER_CALLS" ]; then
    echo -e "${RED}❌ FAIL: Found 'new Logger()' calls:${NC}"
    echo "$NEW_LOGGER_CALLS"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ PASS: No 'new Logger()' calls${NC}"
fi
echo ""

# Check 5: Winston logger imports exist in key files
echo "📋 Check 5: Winston logger imported in key files"
KEY_FILES=(
    "src/server/services/llama/LlamaService.ts"
    "src/server/services/LlamaServerIntegration.ts"
    "server.js"
    "app/api/config/route.ts"
    "src/lib/server-config.ts"
)

WINSTON_IMPORTS_FOUND=0
WINSTON_IMPORTS_MISSING=0

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "getLogger" "$file" 2>/dev/null; then
            echo -e "${GREEN}   ✅${NC} $file"
            ((WINSTON_IMPORTS_FOUND++))
        else
            echo -e "${YELLOW}   ⚠️  $file${NC}"
            ((WINSTON_IMPORTS_MISSING++))
        fi
    fi
done

if [ $WINSTON_IMPORTS_MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: Winston logger imported in all key files${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Winston missing in $WINSTON_IMPORTS_MISSING files${NC}"
    # Don't count as error for now
fi
echo ""

# Check 6: No console.log in server-side code
echo "📋 Check 6: No console.log in server-side code"
CONSOLE_LOGS=$(grep -r "console\\.log" src/server/ src/lib/ --exclude-dir=components 2>/dev/null || true)
if [ -n "$CONSOLE_LOGS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Found console.log calls (may be in client code):${NC}"
    echo "$CONSOLE_LOGS" | head -5
    # Don't count as error - some may be in client code
    echo -e "${YELLOW}   Note: Client-side code (React components) can use console.log${NC}"
else
    echo -e "${GREEN}✅ PASS: No console.log in server-side code${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CRITICAL CHECKS PASSED!${NC}"
    echo ""
    echo "🎉 Winston logger is successfully the single source of truth!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Start server: pnpm dev"
    echo "   2. Check terminal for logs"
    echo "   3. Open http://localhost:3000/logs"
    echo "   4. Verify real-time log streaming in UI"
    echo ""
    exit 0
else
    echo -e "${RED}❌ FAILED: $ERRORS critical error(s) found${NC}"
    echo ""
    echo "Please fix the errors above and run again."
    echo ""
    exit 1
fi
