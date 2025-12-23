#!/bin/bash

echo "Starting WebSocket server..."
echo "Make sure you have run 'pnpm install' first"

# Start the WebSocket server
pnpm run dev:full

echo "WebSocket server should now be running on ws://localhost:3000"
echo "Open another terminal and run 'pnpm run dev' for the Next.js app"