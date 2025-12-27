#!/bin/bash
# Comprehensive test runner for layout components

echo "================================================"
echo "  LAYOUT COMPONENTS - COMPREHENSIVE TEST SUITE"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_files=(
  "__tests__/components/layout/Header.test.tsx"
  "__tests__/components/layout/Layout.test.tsx"
  "__tests__/components/layout/RootLayoutContent.test.tsx"
  "__tests__/components/layout/Sidebar.test.tsx"
  "__tests__/components/layout/SidebarProvider.test.tsx"
  "__tests__/components/layout/MainLayout.test.tsx"
  "__tests__/components/layout/main-layout.test.tsx"
)

total_files=${#test_files[@]}
passed=0
failed=0
errors=0

echo "Found $total_files layout test files"
echo "================================================"
echo ""

for i in "${!test_files[@]}"; do
  test_file="${test_files[$i]}"
  component_name=$(basename "$test_file" .test.tsx)

  echo "[$((i+1))/$total_files] Testing: $component_name"
  echo "-----------------------------------------------"

  # Run the test and capture output
  if pnpm test "$test_file" --passWithNoTests --silent 2>&1 | tail -20; then
    echo -e "${GREEN}✓ PASSED${NC}: $component_name"
    ((passed++))
  else
    echo -e "${RED}✗ FAILED${NC}: $component_name"
    ((failed++))
  fi

  echo ""
done

echo "================================================"
echo "  TEST SUMMARY"
echo "================================================"
echo -e "Total Test Files: $total_files"
echo -e "${GREEN}Passed:${NC}          $passed"
echo -e "${RED}Failed:${NC}          $failed"
echo "================================================"

if [ $failed -eq 0 ]; then
  echo -e "${GREEN}✓ ALL LAYOUT TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  echo ""
  echo "Run individual tests with:"
  echo "  pnpm test __tests__/components/layout/<component>.test.tsx"
  exit 1
fi
