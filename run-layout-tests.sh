#!/bin/bash

# Run all layout component tests
echo "Running all layout component tests..."
echo "========================================"

test_files=(
  "__tests__/components/layout/Header.test.tsx"
  "__tests__/components/layout/Layout.test.tsx"
  "__tests__/components/layout/RootLayoutContent.test.tsx"
  "__tests__/components/layout/Sidebar.test.tsx"
  "__tests__/components/layout/SidebarProvider.test.tsx"
  "__tests__/components/layout/MainLayout.test.tsx"
  "__tests__/components/layout/main-layout.test.tsx"
)

passed=0
failed=0

for test_file in "${test_files[@]}"; do
  echo ""
  echo "Running: $test_file"
  echo "----------------------------------------"
  if pnpm test "$test_file" --passWithNoTests 2>&1 | grep -E "(PASS|FAIL|Tests:|✓|✗)"; then
    ((passed++))
    echo "✓ PASSED: $test_file"
  else
    ((failed++))
    echo "✗ FAILED: $test_file"
  fi
done

echo ""
echo "========================================"
echo "Test Summary:"
echo "  Passed: $passed"
echo "  Failed: $failed"
echo "  Total:  $((passed + failed))"
echo "========================================"

if [ $failed -eq 0 ]; then
  echo "✓ All tests passed!"
  exit 0
else
  echo "✗ Some tests failed!"
  exit 1
fi
