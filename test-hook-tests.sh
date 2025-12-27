#!/bin/bash

# Run all hook tests
echo "Running all hook tests..."
echo ""

pnpm test __tests__/hooks/

echo ""
echo "Hook tests completed!"
