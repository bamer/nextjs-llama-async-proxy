#!/bin/bash
cd /home/bamer/nextjs-llama-async-proxy
pnpm lint 2>&1 | grep -A 2 "@typescript-eslint/no-unused-vars" | head -100
