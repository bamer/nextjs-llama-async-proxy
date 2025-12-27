#!/bin/bash

# Run tests for the lib directory

echo "Running tests for src/lib modules..."
pnpm test src/lib/__tests__/ollama.test.ts src/lib/__tests__/process-manager.test.ts src/lib/__tests__/server-config.test.ts src/lib/__tests__/state-file.test.ts src/lib/__tests__/store.test.ts src/lib/__tests__/validators.test.ts src/lib/__tests__/websocket-client.test.ts src/lib/__tests__/websocket-transport.test.ts

echo "Test execution completed."
