# Layout Tests - Quick Reference Guide

## Quick Commands

### Run All Layout Tests
```bash
pnpm test __tests__/components/layout/
```

### Run With Comprehensive Output
```bash
./run-comprehensive-layout-tests.sh
```

### Run Individual Test File
```bash
pnpm test __tests__/components/layout/Header.test.tsx
```

### Run With Coverage
```bash
pnpm test __tests__/components/layout/ --coverage
```

### Run in Watch Mode
```bash
pnpm test __tests__/components/layout/ --watch
```

## Test Files Structure

```
__tests__/components/layout/
├── Core Tests (Original Suite)
│   ├── Header.test.tsx                    (8 tests, 111 lines)
│   ├── Layout.test.tsx                    (13 tests, 176 lines)
│   ├── RootLayoutContent.test.tsx          (15 tests, 178 lines)
│   ├── Sidebar.test.tsx                   (13 tests, 245 lines)
│   ├── SidebarProvider.test.tsx           (9 tests, 203 lines)
│   ├── MainLayout.test.tsx                (10 tests, 138 lines)
│   └── main-layout.test.tsx               (16 tests, 241 lines)
│
├── Comprehensive Tests (Enhanced Suite)
│   ├── Header.comprehensive.test.tsx      (30+ tests, 311 lines)
│   ├── Sidebar.comprehensive.test.tsx     (30+ tests, 311 lines)
│   └── SidebarProvider.comprehensive.test.tsx (20+ tests, 311 lines)
│
└── Scripts
    ├── run-comprehensive-layout-tests.sh   (Master runner)
    ├── verify-layout-tests.sh             (Verification)
    ├── run-layout-tests.sh                (Basic runner)
    └── test-layout-individual.sh          (Individual tests)
```

## Test Coverage Summary

### Components Covered ✓
- [x] Header
- [x] Layout
- [x] RootLayoutContent
- [x] Sidebar
- [x] SidebarProvider
- [x] MainLayout
- [x] main-layout

### Test Scenarios Covered ✓
- [x] Component rendering
- [x] Responsive design
- [x] Navigation (all routes)
- [x] Sidebar toggle (open/close/toggle)
- [x] Theme integration (dark/light modes)
- [x] Accessibility (ARIA labels, keyboard nav)
- [x] Component composition
- [x] DOM structure
- [x] Event handling
- [x] State management
- [x] Edge cases

### Mocked Dependencies ✓
- [x] next/navigation (usePathname)
- [x] @/contexts/ThemeContext (useTheme)
- [x] @/components/layout/SidebarProvider
- [x] @/components/ui/ThemeToggle

## Test Statistics

| Metric | Count |
|--------|-------|
| Total Test Files | 10 |
| Total Test Cases | ~150+ |
| Total Lines of Code | ~2,500+ |
| Components Tested | 7 |
| Test Scenarios | 11 |

## Navigation Routes Tested

All navigation links are tested for active states:
- `/dashboard` - Dashboard
- `/monitoring` - Monitoring
- `/models` - Models
- `/logs` - Logs
- `/settings` - Settings

## Theme States Tested

Both light and dark modes are tested for all components:
- Light mode styling ✓
- Dark mode styling ✓
- Theme switching ✓

## Common Test Patterns

### 1. Rendering Test
```typescript
it('renders correctly', () => {
  renderWithTheme(<Component />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### 2. Interaction Test
```typescript
it('calls handler on click', () => {
  renderWithTheme(<Component />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  expect(mockHandler).toHaveBeenCalled();
});
```

### 3. Theme Test
```typescript
it('applies dark mode styles', () => {
  renderWithTheme(<Component />, true); // isDark = true
  expect(element).toHaveStyle({ background: '...' });
});
```

### 4. State Test
```typescript
it('toggles state', () => {
  renderWithTheme(<Component />);
  const toggle = screen.getByTestId('toggle');
  fireEvent.click(toggle);
  expect(state).toBe(true);
});
```

## Troubleshooting

### Tests Failing?
1. Check mocks are correctly configured
2. Verify all dependencies are mocked
3. Ensure test environment is setup (jest.setup.ts)
4. Run with `--verbose` flag for details

### Coverage Low?
1. Run `pnpm test __tests__/components/layout/ --coverage`
2. Check coverage report in `coverage/` directory
3. Identify uncovered lines and add tests

### Import Errors?
1. Check `jest.config.ts` for module paths
2. Verify `tsconfig.json` path aliases
3. Ensure all mocks are set up before rendering

## Best Practices Followed

✓ Using React Testing Library
✓ Testing behavior, not implementation
✓ Using data-testid for selectors
✓ Mocking all external dependencies
✓ Comprehensive test coverage
✓ Accessible testing (ARIA labels)
✓ Responsive design testing
✓ Theme integration testing
✓ Error handling testing
✓ Edge case testing

## Quick Reference Table

| Component | Test File | Tests | Lines |
|-----------|-----------|-------|-------|
| Header | Header.test.tsx | 8 | 111 |
| Header (Enhanced) | Header.comprehensive.test.tsx | 30+ | 311 |
| Layout | Layout.test.tsx | 13 | 176 |
| RootLayoutContent | RootLayoutContent.test.tsx | 15 | 178 |
| Sidebar | Sidebar.test.tsx | 13 | 245 |
| Sidebar (Enhanced) | Sidebar.comprehensive.test.tsx | 30+ | 311 |
| SidebarProvider | SidebarProvider.test.tsx | 9 | 203 |
| SidebarProvider (Enhanced) | SidebarProvider.comprehensive.test.tsx | 20+ | 311 |
| MainLayout | MainLayout.test.tsx | 10 | 138 |
| main-layout | main-layout.test.tsx | 16 | 241 |

## Documentation

- `LAYOUT_TESTS_DOCUMENTATION.md` - Full documentation
- `LAYOUT_TEST_COVERAGE_REPORT.md` - Coverage report
- `LAYOUT_TEST_QUICK_REFERENCE.md` - This file

## Contact

For questions about the test suite, refer to:
- Project README.md
- AGENTS.md for coding guidelines
- jest.config.ts for test configuration
