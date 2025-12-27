#!/bin/bash

# Test dashboard components specifically

echo "Testing dashboard components..."
pnpm test --testPathPattern="dashboard" --verbose
