# VSCode Testing Configuration Guide

## Setting Up Visual Test Results in VSCode

This guide shows how to configure VSCode for optimal testing with visual feedback.

### 1. Install Required VSCode Extensions

Install these extensions for the best testing experience:

- **Jest** - Official Jest extension for test running
- **Jest Runner** - Run and debug Jest tests
- **Test Explorer UI** - Visual test explorer interface
- **Wallaby.js** (optional) - Real-time test coverage

### 2. VSCode Launch Configuration

Add this to your `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--watchAll=false",
        "--verbose",
        "--colors"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--watchAll=false",
        "--verbose",
        "--colors",
        "--testPathPattern",
        "${relativeFile}"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 3. VSCode Settings for Testing

Add to `.vscode/settings.json`:

```json
{
  "jest.pathToJest": "node_modules/.bin/jest",
  "jest.autoEnable": true,
  "jest.autoRun": "watch",
  "jest.coverageFormatter": "default",
  "jest.debugCodeLens.showWhenTestStateIn": ["fail", "unknown"],
  "jest.showCoverageOnLoad": true,
  "jest.testExplorer.enabled": true,
  "jest.testSideBar.enabled": true,
  "jest.useSeparateOutputChannel": true,
  "jest.enableInlineErrorMessages": true,
  "jest.enableSnapshotPreview": true
}
```

### 4. Running Tests with Visual Feedback

#### Method 1: Using Test Explorer
1. Open Test Explorer (Ctrl+Shift+T or Cmd+Shift+T)
2. See all tests organized by file
3. Click run icon next to individual tests or suites
4. View pass/fail status with colors

#### Method 2: Using Command Palette
1. Ctrl+Shift+P (Cmd+Shift+P on Mac)
2. Type "Jest: Run All Tests"
3. See results in output panel

#### Method 3: Debugging Tests
1. Set breakpoints in test files
2. Use "Debug Jest Tests" launch configuration
3. Step through test execution

### 5. Test Coverage Visualization

Run this command for coverage with visual overlay:

```bash
pnpm test:coverage
```

Then open `coverage/lcov-report/index.html` in browser for interactive coverage report.

### 6. Recommended Test Structure

```
__tests__/
├── api/                  # API endpoint tests
│   ├── websocket/        # WebSocket functionality tests
│   └── sse/              # SSE endpoint tests
├── components/           # Component tests
│   ├── ui/              # UI component tests
│   └── pages/            # Page component tests
├── integration/          # Integration tests
│   ├── websocket/        # WebSocket integration tests
│   └── realtime/         # Real-time data flow tests
├── utils/                # Utility function tests
└── setup/                # Test setup and helpers
```

### 7. Writing Tests for VSCode

Example test with good VSCode integration:

```typescript
// __tests__/components/ThemeToggle.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { ThemeProvider } from '../../src/contexts/ThemeContext';

describe('ThemeToggle Component', () => {
  const renderWithTheme = (component: React.ReactNode) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  it('should render theme toggle button', () => {
    renderWithTheme(<ThemeToggle />);
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
  });

  it('should cycle through themes on click', () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByLabelText('Toggle theme');
    
    // Initial state
    expect(button).toBeInTheDocument();
    
    // First click - should change theme
    fireEvent.click(button);
    // Add assertions for theme change
  });
});
```

### 8. Test Watch Mode

For development, use watch mode:

```bash
pnpm test:watch
```

This will:
- Automatically re-run tests on file changes
- Show visual feedback in VSCode
- Highlight failing tests
- Provide quick feedback loop

### 9. Troubleshooting

**Issue: Tests not showing in VSCode?**
- Ensure Jest extension is installed
- Check that test files have `.test.ts` or `.test.tsx` extension
- Verify `jest.config.js` has correct paths

**Issue: No colors in output?**
- Add `--colors` flag to Jest configuration
- Check VSCode terminal color settings

**Issue: Slow test execution?**
- Use `--runInBand` for sequential execution
- Check for memory leaks in tests
- Consider test isolation

## Summary

With this configuration, you'll have:
- ✅ Visual test results directly in VSCode
- ✅ Easy test execution and debugging
- ✅ Quick feedback during development
- ✅ Comprehensive test coverage visualization
- ✅ Confidence in your code quality