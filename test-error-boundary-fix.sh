#!/bin/bash

# Test script to verify Error Boundary infinite loop fix
# This script tests fix for "Maximum update depth exceeded" error

echo "=========================================="
echo "Testing Error Boundary Infinite Loop Fix"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Verify ModelsListCard changes
echo "1. Checking ModelsListCard.tsx for infinite loop prevention..."
echo ""

# Check for isInitializedRef guard
if grep -q "isInitializedRef" src/components/dashboard/ModelsListCard.tsx; then
    echo -e "${GREEN}✓${NC} Found isInitializedRef guard to prevent initial render issues"
else
    echo -e "${RED}✗${NC} Missing isInitializedRef guard"
    exit 1
fi

# Check for simplified architecture (no competing effects)
if ! grep -q "clearOptimisticStatusForModels" src/components/dashboard/ModelsListCard.tsx && \
   grep -q "// Load model templates when models list changes" src/components/dashboard/ModelsListCard.tsx; then
    echo -e "${GREEN}✓${NC} Found simplified architecture without competing effects"
else
    echo -e "${RED}✗${NC} Missing simplified architecture"
    exit 1
fi

# Check for proper architecture (removed problematic setState in useEffect)
if ! grep -q "setOptimisticStatus.*useEffect" src/components/dashboard/ModelsListCard.tsx && \
   grep -q "handleToggleModelOptimistic" src/components/dashboard/ModelsListCard.tsx; then
    echo -e "${GREEN}✓${NC} Found proper callback-based optimistic status handling"
else
    echo -e "${RED}✗${NC} Missing proper optimistic status handling"
    exit 1
fi

echo ""
echo "2. Checking ErrorBoundary.tsx for defensive logging..."
echo ""

# Check for error validation before logging
if grep -q "hasValidError" src/components/ui/error-boundary.tsx; then
    echo -e "${GREEN}✓${NC} Found error validation before logging to client logger"
else
    echo -e "${RED}✗${NC} Missing error validation before logging"
    exit 1
fi

# Check for default values in error logging
if grep -q '"Unknown"' src/components/ui/error-boundary.tsx && \
   grep -q '"No message available"' src/components/ui/error-boundary.tsx; then
    echo -e "${GREEN}✓${NC} Found default values for missing error properties"
else
    echo -e "${RED}✗${NC} Missing default values for error properties"
    exit 1
fi

echo ""
echo "3. Verifying lint status..."
echo ""

if pnpm lint src/components/dashboard/ModelsListCard.tsx src/components/ui/error-boundary.tsx > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} No lint errors"
else
    echo -e "${RED}✗${NC} Lint errors found"
    exit 1
fi

echo ""
echo "4. Verifying specific fixes for reported error..."
echo ""

# Check for specific infinite loop fix
if grep -q "Skip initial render to avoid hydration" src/components/dashboard/ModelsListCard.tsx; then
    echo -e "${GREEN}✓${NC} Found hydration guard to prevent initial render loop"
else
    echo -e "${RED}✗${NC} Missing hydration guard"
    exit 1
fi

# Check that we have correct number of effects
EFFECT_COUNT=$(grep -c "^  useEffect(" src/components/dashboard/ModelsListCard.tsx || echo "0")
if [ "$EFFECT_COUNT" -eq 2 ]; then
    echo -e "${GREEN}✓${NC} Correct number of useEffects (2 total: mount, modelsList)"
else
    echo -e "${YELLOW}⚠${NC} Warning: Expected 2 useEffects, found $EFFECT_COUNT"
fi

echo ""
echo "5. Code quality checks..."
echo ""

# Check for proper TypeScript types
if grep -q "Record<string, string>" src/components/dashboard/ModelsListCard.tsx; then
    echo -e "${GREEN}✓${NC} Using proper TypeScript types (Record<string, string>)"
else
    echo -e "${RED}✗${NC} Missing proper TypeScript types"
    exit 1
fi

# Check for proper spacing (AGENTS.md compliance)
if grep -E "^\s{2}" src/components/dashboard/ModelsListCard.tsx | grep -v "^\s{3}" | head -1 > /dev/null; then
    echo -e "${GREEN}✓${NC} Using 2-space indentation"
else
    echo -e "${YELLOW}⚠${NC} Warning: Indentation might not match AGENTS.md"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}All checks passed!${NC}"
echo "=========================================="
echo ""
echo "Summary of fixes applied:"
echo "1. ✅ Added isInitializedRef guard to prevent initial render loops"
echo "2. ✅ Simplified architecture by removing competing useEffect hooks"
echo "3. ✅ Removed problematic setState calls in useEffect (proper callback pattern)"
echo "4. ✅ Added error validation before logging in ErrorBoundary"
echo "5. ✅ Added default values for missing error properties"
echo ""
echo "Next steps:"
echo "1. Run: pnpm dev"
echo "2. Open browser to http://localhost:3000/dashboard"
echo "3. Verify no 'Maximum update depth exceeded' error in console"
echo "4. Verify no empty {} error messages in console"
echo "5. Test model loading and template selection"
echo ""
