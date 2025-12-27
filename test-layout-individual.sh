#!/bin/bash
set -e

echo "Testing Header component..."
pnpm test __tests__/components/layout/Header.test.tsx --passWithNoTests --verbose || true

echo ""
echo "Testing Layout component..."
pnpm test __tests__/components/layout/Layout.test.tsx --passWithNoTests --verbose || true

echo ""
echo "Testing RootLayoutContent component..."
pnpm test __tests__/components/layout/RootLayoutContent.test.tsx --passWithNoTests --verbose || true

echo ""
echo "Testing Sidebar component..."
pnpm test __tests__/components/layout/Sidebar.test.tsx --passWithNoTests --verbose || true

echo ""
echo "Testing SidebarProvider component..."
pnpm test __tests__/components/layout/SidebarProvider.test.tsx --passWithNoTests --verbose || true

echo ""
echo "Testing MainLayout (PascalCase) component..."
pnpm test __tests__/components/layout/MainLayout.test.tsx --passWithNoTests --verbose || true

echo ""
echo "Testing main-layout (kebab-case) component..."
pnpm test __tests__/components/layout/main-layout.test.tsx --passWithNoTests --verbose || true
