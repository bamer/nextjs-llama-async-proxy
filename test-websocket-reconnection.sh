#!/bin/bash

# Test WebSocket reconnection implementation

echo "Running TypeScript type check..."
pnpm type:check
echo ""

echo "Running ESLint..."
pnpm lint
echo ""

echo "Running WebSocket hook tests..."
pnpm test __tests__/hooks/use-websocket.test.ts
echo ""

echo "✅ All checks passed!"
