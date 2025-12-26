#!/bin/bash

echo "🛑 Stopping Next.js server..."

# Kill all processes related to the app
pkill -9 -f "nextjs-llama-async-proxy" 2>/dev/null
pkill -9 -f "tsx.*server.js" 2>/dev/null
pkill -9 -f "llama-server" 2>/dev/null

# Wait for processes to stop
sleep 2

# Remove lock files
rm -f /home/bamer/nextjs-llama-async-proxy/.next/dev/lock
rm -f /home/bamer/nextjs-llama-async-proxy/.next/turbo/

# Kill any remaining node processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Kill any remaining node processes on port 8134
lsof -ti:8134 | xargs kill -9 2>/dev/null

echo "✅ Server stopped"
echo "🚀 Starting Next.js server..."

# Start fresh
cd /home/bamer/nextjs-llama-async-proxy
pnpm dev
