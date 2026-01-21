#!/bin/bash

# ================================================
# Llama Proxy Dashboard - Server Restart Script
# ================================================

echo "🛑 Stopping servers..."

# Kill llama-server processes (llama.cpp inference server)
echo "   Killing llama-server..."
pkill -9 -f "llama-server" 2>/dev/null || true

# Kill node server.js processes (our dashboard)
echo "   Killing node server.js..."
pkill -9 -f "node.*server.js" 2>/dev/null || true

# Kill any remaining processes on our ports
echo "   Freeing port 3000..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true

# Wait for cleanup
sleep 2

# Verify processes are stopped
if pgrep -f "node.*server.js" > /dev/null; then
    echo "⚠️  Node server still running, forcing..."
    pkill -9 -f "node.*server" 2>/dev/null || true
    sleep 1
fi

if pgrep -f "llama-server" > /dev/null; then
    echo "⚠️  llama-server still running, forcing..."
    pkill -9 -f "llama-server" 2>/dev/null || true
    sleep 1
fi

echo "✅ All servers stopped"

# Start the dashboard server
echo ""
echo "🚀 Starting Llama Proxy Dashboard..."
cd /home/bamer/nextjs-llama-async-proxy
pnpm start
