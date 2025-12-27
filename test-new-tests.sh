#!/bin/bash

# Script to count tests and run all lib tests

echo "======================================"
echo "Test Creation Summary"
echo "======================================"
echo ""
echo "Test files created:"
echo ""

count=0

# Count test cases in each file
for file in \
  src/lib/__tests__/ollama.test.ts \
  src/lib/__tests__/process-manager.test.ts \
  src/lib/__tests__/server-config.test.ts \
  src/lib/__tests__/state-file.test.ts \
  src/lib/__tests__/store.test.ts \
  src/lib/__tests__/validators.test.ts \
  src/lib/__tests__/websocket-client.test.ts \
  src/lib/__tests__/websocket-transport.test.ts
do
  if [ -f "$file" ]; then
    test_count=$(grep -c "it(" "$file" 2>/dev/null || echo 0)
    describe_count=$(grep -c "describe(" "$file" 2>/dev/null || echo 0)
    echo "  ✓ $file: $test_count tests, $describe_count test suites"
    ((count++))
  fi
done

echo ""
echo "Total test files created: $count"
echo ""

echo "Running tests..."
echo "======================================"

pnpm test \
  src/lib/__tests__/ollama.test.ts \
  src/lib/__tests__/process-manager.test.ts \
  src/lib/__tests__/server-config.test.ts \
  src/lib/__tests__/state-file.test.ts \
  src/lib/__tests__/store.test.ts \
  src/lib/__tests__/validators.test.ts \
  src/lib/__tests__/websocket-client.test.ts \
  src/lib/__tests__/websocket-transport.test.ts

echo ""
echo "======================================"
echo "Test Execution Complete"
echo "======================================"
