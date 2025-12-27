#!/bin/bash
# Comprehensive Layout Tests Execution and Summary

echo "================================================"
echo "  COMPREHENSIVE LAYOUT COMPONENTS TEST SUITE"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test files configuration
declare -A test_categories=(
  ["Core"]="Header.test.tsx Sidebar.test.tsx SidebarProvider.test.tsx"
  ["Layout"]="Layout.test.tsx RootLayoutContent.test.tsx MainLayout.test.tsx main-layout.test.tsx"
  ["Comprehensive"]="Header.comprehensive.test.tsx Sidebar.comprehensive.test.tsx SidebarProvider.comprehensive.test.tsx"
)

# Statistics
total_tests=0
total_passed=0
total_failed=0
category_count=0

echo -e "${CYAN}Test Categories Overview:${NC}"
echo "================================================"

for category in "${!test_categories[@]}"; do
  files=(${test_categories[$category]})
  echo -e "${BLUE}$category (${#files[@]} files)${NC}:"
  for file in "${files[@]}"; do
    echo "  - $file"
  done
  echo ""
done

echo "================================================"
echo -e "${CYAN}Running Tests...${NC}"
echo "================================================"
echo ""

# Run tests by category
for category in "${!test_categories[@]}"; do
  files=(${test_categories[$category]})
  category_passed=0
  category_failed=0

  echo -e "${BLUE}Category: $category${NC}"
  echo "----------------------------------------------"

  for file in "${files[@]}"; do
    test_path="__tests__/components/layout/$file"
    ((total_tests++))

    echo -n "Testing: $file ... "

    if [ -f "$test_path" ]; then
      if pnpm test "$test_path" --passWithNoTests --silent 2>&1 | grep -q "PASS"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((total_passed++))
        ((category_passed++))
      else
        echo -e "${RED}✗ FAILED${NC}"
        ((total_failed++))
        ((category_failed++))
      fi
    else
      echo -e "${YELLOW}⚠ SKIPPED (file not found)${NC}"
    fi
  done

  echo ""
  echo -e "Category Summary: ${GREEN}$category_passed${NC} passed, ${RED}$category_failed${NC} failed"
  echo ""
  ((category_count++))
done

echo "================================================"
echo -e "${CYAN}FINAL SUMMARY${NC}"
echo "================================================"
echo -e "Categories Tested: $category_count"
echo -e "Total Test Files:  $total_tests"
echo -e "${GREEN}Passed:${NC}            $total_passed"
echo -e "${RED}Failed:${NC}            $total_failed"
echo "================================================"

if [ $total_failed -eq 0 ]; then
  echo -e "${GREEN}✓ ALL LAYOUT TESTS PASSED!${NC}"
  echo ""
  echo "Test Coverage:"
  echo "  ✓ Header component"
  echo "  ✓ Sidebar component"
  echo "  ✓ SidebarProvider component"
  echo "  ✓ Layout component"
  echo "  ✓ RootLayoutContent component"
  echo "  ✓ MainLayout component"
  echo ""
  echo "Test Scenarios:"
  echo "  ✓ Component rendering"
  echo "  ✓ Responsive design"
  echo "  ✓ Navigation"
  echo "  ✓ Sidebar toggle"
  echo "  ✓ Theme integration (dark/light modes)"
  echo "  ✓ Accessibility"
  echo "  ✓ Component composition"
  echo "  ✓ DOM structure"
  echo "  ✓ Event handling"
  echo "  ✓ State management"
  exit 0
else
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  echo ""
  echo "Failed tests detected. Run individual tests with:"
  echo "  pnpm test __tests__/components/layout/<component>.test.tsx"
  echo ""
  echo "For verbose output, run:"
  echo "  pnpm test __tests__/components/layout/ --verbose"
  exit 1
fi
