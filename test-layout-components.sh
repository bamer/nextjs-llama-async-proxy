#!/bin/bash
set -e

# Test Header component
echo "========================================="
echo "Testing Header Component"
echo "========================================="
pnpm test __tests__/components/layout/Header.test.tsx --passWithNoTests
echo ""

# Test Layout component
echo "========================================="
echo "Testing Layout Component"
echo "========================================="
pnpm test __tests__/components/layout/Layout.test.tsx --passWithNoTests
echo ""

# Test RootLayoutContent component
echo "========================================="
echo "Testing RootLayoutContent Component"
echo "========================================="
pnpm test __tests__/components/layout/RootLayoutContent.test.tsx --passWithNoTests
echo ""

# Test Sidebar component
echo "========================================="
echo "Testing Sidebar Component"
echo "========================================="
pnpm test __tests__/components/layout/Sidebar.test.tsx --passWithNoTests
echo ""

# Test SidebarProvider component
echo "========================================="
echo "Testing SidebarProvider Component"
echo "========================================="
pnpm test __tests__/components/layout/SidebarProvider.test.tsx --passWithNoTests
echo ""

# Test MainLayout component (PascalCase)
echo "========================================="
echo "Testing MainLayout Component (PascalCase)"
echo "========================================="
pnpm test __tests__/components/layout/MainLayout.test.tsx --passWithNoTests
echo ""

# Test main-layout component (kebab-case)
echo "========================================="
echo "Testing MainLayout Component (kebab-case)"
echo "========================================="
pnpm test __tests__/components/layout/main-layout.test.tsx --passWithNoTests
echo ""

echo "========================================="
echo "All Layout Tests Complete!"
echo "========================================="
