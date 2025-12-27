#!/bin/bash

# Run the complete test suite with coverage and save detailed reports
echo "Running test suite with coverage..."
echo "======================================"
echo ""

# Run jest with coverage
pnpm test:coverage 2>&1 | tee test-coverage-output.log

# Extract the summary
echo ""
echo "======================================"
echo "Coverage Summary"
echo "======================================"

# Check if coverage report was generated
if [ -f "coverage/coverage-summary.json" ]; then
  echo ""
  echo "Coverage report generated at coverage/coverage-summary.json"
  cat coverage/coverage-summary.json | python3 -m json.tool
fi

# Also show the coverage table from Jest output
echo ""
echo "Full coverage table:"
grep -A 100 "File" test-coverage-output.log | head -150

echo ""
echo "======================================"
echo "Detailed coverage information saved to:"
echo "  - test-coverage-output.log"
echo "  - coverage/coverage-summary.json"
echo "  - coverage/ (HTML reports in lcov-report/)"
echo "======================================"
