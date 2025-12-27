#!/bin/bash

# Store Edge Case Tests Runner
# This script runs all store tests and generates a coverage report

set -e

echo "======================================"
echo "Running Store Edge Case Tests"
echo "======================================"
echo ""

# Run type check first
echo "1. Running type check..."
pnpm type:check || { echo "Type check failed!"; exit 1; }
echo "   ✅ Type check passed"
echo ""

# Run edge case tests
echo "2. Running edge case tests..."
pnpm test __tests__/lib/store.edge-cases.test.ts || { echo "Edge case tests failed!"; exit 1; }
echo "   ✅ Edge case tests passed"
echo ""

# Run all store tests
echo "3. Running all store tests..."
pnpm test __tests__/lib/store.test.ts __tests__/lib/store.edge-cases.test.ts || { echo "Store tests failed!"; exit 1; }
echo "   ✅ All store tests passed"
echo ""

# Generate coverage report
echo "4. Generating coverage report..."
pnpm test:coverage -- __tests__/lib/store.*.test.ts || { echo "Coverage report failed!"; exit 1; }
echo "   ✅ Coverage report generated"
echo ""

echo "======================================"
echo "All tests completed successfully!"
echo "======================================"
echo ""
echo "Coverage report available in: coverage/"
echo "Open coverage/lcov-report/index.html in a browser for detailed coverage"
echo ""
