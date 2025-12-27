#!/bin/bash

echo "========================================="
echo "  Service Test Files Verification"
echo "========================================="
echo ""

SERVICE_TESTS=(
  "__tests__/lib/services/ModelDiscoveryService.test.ts"
  "__tests__/lib/services/parameterService.test.ts"
  "__tests__/server/services/LlamaServerIntegration.test.ts"
  "__tests__/server/services/LlamaService.test.ts"
  "__tests__/server/services/llama/argumentBuilder.test.ts"
  "__tests__/server/services/llama/healthCheck.test.ts"
  "__tests__/server/services/llama/logger.test.ts"
  "__tests__/server/services/llama/modelLoader.test.ts"
  "__tests__/server/services/llama/processManager.test.ts"
  "__tests__/server/services/llama/retryHandler.test.ts"
  "__tests__/server/services/llama/stateManager.test.ts"
)

TOTAL_FILES=0
EXISTING_FILES=0
TOTAL_TESTS=0

for test_file in "${SERVICE_TESTS[@]}"; do
  TOTAL_FILES=$((TOTAL_FILES + 1))

  if [ -f "$test_file" ]; then
    EXISTING_FILES=$((EXISTING_FILES + 1))
    LINES=$(wc -l < "$test_file")
    TEST_COUNT=$(grep -c -E "(it\(|test\()" "$test_file" || echo "0")
    DESCRIBE_COUNT=$(grep -c "describe(" "$test_file" || echo "0")

    TOTAL_TESTS=$((TOTAL_TESTS + TEST_COUNT))
    echo "✅ $test_file"
    echo "   - Lines: $LINES"
    echo "   - Test suites: $DESCRIBE_COUNT"
    echo "   - Test cases: $TEST_COUNT"
    echo ""
  else
    echo "❌ $test_file - NOT FOUND"
    echo ""
  fi
done

echo "========================================="
echo "  Summary"
echo "========================================="
echo "Total files expected: $TOTAL_FILES"
echo "Total files found: $EXISTING_FILES"
echo "Total test cases: $TOTAL_TESTS"
echo "========================================="
echo ""

if [ $EXISTING_FILES -eq $TOTAL_FILES ]; then
  echo "✅ All service test files exist!"
  echo ""
  echo "📝 Test Files Created:"
  for test_file in "${SERVICE_TESTS[@]}"; do
    echo "   - $test_file"
  done
  echo ""
  echo "✅ Total $TOTAL_TESTS tests written"
  echo ""
  echo "🏁 Running tests..."
  echo ""
  pnpm test --testPathPattern="${SERVICE_TESTS[*]}" --passWithNoTests 2>&1 | tail -50
else
  echo "❌ Some test files are missing"
  exit 1
fi
