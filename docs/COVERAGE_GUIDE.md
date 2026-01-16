# Test Coverage Guide

This document describes how to run tests with coverage reports and view them in VSCode.

## Quick Start

```bash
# Run tests with coverage report
pnpm test:coverage

# This will:
# 1. Run all tests with Jest
# 2. Generate coverage reports (text, HTML, JSON)
# 3. Display a formatted summary in the terminal
# 4. Generate coverage report at coverage/index.html
```

## Test Suite Structure

The project has **473+ comprehensive tests** organized as follows:

```
__tests__/
├── server/                    # Backend tests
│   ├── db/                    # Database layer tests (84 tests)
│   ├── handlers/              # API handler tests
│   │   └── llama-router/      # Router-specific tests
│   └── metadata.test.js       # GGUF metadata parsing (60 tests)
├── frontend/                  # Frontend tests
│   ├── core/                  # Component, Router, State tests
│   ├── components/            # UI component tests
│   ├── services/              # Service layer tests
│   └── utils/                 # Utility tests (323 tests)
├── browser/                   # E2E browser tests
├── integration/               # Integration tests
└── utils/                     # Shared test utilities
```

### Test Coverage Summary

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `__tests__/server/db.test.js` | 84 tests | 100% DB operations |
| `__tests__/server/metadata.test.js` | 60 tests | 100% metadata parsing |
| `__tests__/utils/validation.test.js` | 230 tests | 100% validation functions |
| `__tests__/utils/format.test.js` | 93 tests | 100% formatting functions |

## Coverage Reports

### Terminal Report

When you run `pnpm test:coverage`, you'll see:

```
╔═══════════════════════════════════════════════════════════════
               COVERAGE REPORT - TEST SUMMARY
╔═══════════════════════════════════════════════════════════════

  Metric          │  Statements  │  Branches  │  Functions  │  Lines
───────────────────────────────────────────────────────────────
  Coverage        │   XX.X%      │   XX.X%    │   XX.X%     │   XX.X%
───────────────────────────────────────────────────────────────
  Statements    : 1234/1444
  Branches      : 567/690
  Functions     : 234/263
  Lines         : 1200/1388
╔═══════════════════════════════════════════════════════════════

File Coverage:

   86.5%  server.js
   89.2%  server/db.js
   85.1%  public/js/utils/validation.js
   92.3%  public/js/utils/format.js
   ...

╔═══════════════════════════════════════════════════════════════
✓ HTML report generated at: coverage/index.html
✓ Run 'open coverage/index.html' to view detailed report
╔═══════════════════════════════════════════════════════════════
```

**Color coding:**

- 🟢 Green (≥90%): Excellent coverage
- 🟡 Yellow (≥80%): Good coverage
- 🔴 Red (<80%): Needs improvement

### HTML Report

The HTML report includes:

- **Summary dashboard** - Overview of all metrics
- **File list** - Click to drill into specific files
- **Line-by-line coverage** - See which lines are covered/uncovered
- **Branch coverage** - View branch coverage for conditionals
- **Filters** - Filter by coverage threshold

View the report:

```bash
# Open the HTML report directly
open coverage/index.html
```

### JSON Report

For CI/CD integration or automated analysis:

```bash
# Full coverage details
cat coverage/coverage-final.json

# Summary only
cat coverage/coverage-summary.json
```

## Coverage Reports

### Terminal Report

When you run `pnpm test:coverage`, you'll see:

```
═══════════════════════════════════════════════════════════════
               COVERAGE REPORT - TEST SUMMARY
═══════════════════════════════════════════════════════════════

  Metric          |  Statements  |  Branches  |  Functions  |  Lines
───────────────────────────────────────────────────────────────
  Coverage        |   85.3%      |   82.1%    |   88.9%     |   86.5%
───────────────────────────────────────────────────────────────
  Statements    : 1234/1444
  Branches      : 567/690
  Functions     : 234/263
  Lines         : 1200/1388
═══════════════════════════════════════════════════════════════

File Coverage:

   86.5%  server.js
   89.2%  server/db.js
   85.1%  public/js/utils/validation.js
   92.3%  public/js/utils/format.js
   ...

═══════════════════════════════════════════════════════════════
✓ HTML report generated at: coverage/index.html
✓ Run 'open coverage/index.html' to view detailed report
═══════════════════════════════════════════════════════════════
```

**Color coding:**

- 🟢 Green (≥90%): Excellent coverage
- 🟡 Yellow (≥80%): Good coverage
- 🔴 Red (<80%): Needs improvement

### HTML Report

The interactive HTML report opens automatically and includes:

- **Summary dashboard** - Overview of all metrics
- **File list** - Click to drill into specific files
- **Line-by-line coverage** - See which lines are covered/uncovered
- **Branch coverage** - View branch coverage for conditionals
- **Filters** - Filter by coverage threshold

View the report:

```bash
# Open the HTML report directly
open coverage/index.html

# Or from VSCode, click "Open in Browser" when viewing coverage/index.html
```

### JSON Report

For CI/CD integration or automated analysis:

```bash
# Full coverage details
cat coverage/coverage-final.json

# Summary only
cat coverage/coverage-summary.json
```

## VSCode Integration

### Recommended Extensions

The project recommends these extensions for better coverage visualization:

1. **Jest** (orta.vscode-jest)
   - Run tests from the editor
   - View coverage inline in code
   - Debug tests directly

2. **Coverage Gutters** (ryanluker.vscode-coverage-gutters)
   - Shows coverage indicators in the editor gutter
   - Red/green highlights for covered/uncovered lines
   - Hover for coverage details

3. **Jest Runner** (firsttris.vscode-jest-runner)
   - Run individual tests
   - Quick coverage debugging

Install all recommended extensions:

```
VSCode → Extensions → View Recommended Extensions
```

Or install manually:

```bash
code --install-extension orta.vscode-jest
code --install-extension ryanluker.vscode-coverage-gutters
code --install-extension firsttris.vscode-jest-runner
```

### Coverage Gutters Setup

After installing "Coverage Gutters":

1. Open any JavaScript file in the project
2. Run: `Coverage Gutters: Display Coverage`
3. The editor shows:
   - **Green highlight** = Code is tested
   - **Red highlight** = Code is not tested
   - **Yellow highlight** = Branch not tested

Toggle coverage display:

```
Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
Type: "Coverage Gutters: Display Coverage"
```

### Watch Mode with Coverage

For continuous coverage monitoring during development:

```bash
# Run tests in watch mode
pnpm test:watch

# This watches for file changes and reruns tests
# The Jest extension will show coverage inline
```

## Coverage Thresholds

The project enforces minimum coverage thresholds:

```
Statements: 80%
Branches: 80%
Functions: 80%
Lines: 80%
```

If coverage falls below these thresholds, `pnpm test:coverage` will fail.

**Fix coverage:**

1. Identify uncovered files in the report
2. Add tests for those lines/branches
3. Rerun coverage

## Improving Coverage

### Find Uncovered Code

1. **From HTML report:**
   - Click on a file with coverage < 80%
   - Red lines are uncovered
   - Write tests to cover them

2. **From VSCode:**
   - Install Coverage Gutters
   - Red highlights show uncovered code
   - Add tests for those sections

### Coverage Checklist

When writing tests, cover:

- ✅ Happy path (normal operation)
- ✅ Error cases (exceptions, rejections)
- ✅ Edge cases (null, undefined, empty)
- ✅ Branching logic (if/else, switch)
- ✅ Loop iterations (0, 1, multiple items)

### Example: Getting to 100%

```javascript
// Original function with low coverage
function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}
```

**Uncovered branches:**

- `bytes === 0`
- Each size unit in the array
- Invalid inputs (negative, non-number)

**Tests needed:**

```javascript
test("formatSize covers all cases", () => {
  expect(formatSize(0)).toBe("0 B"); // bytes === 0
  expect(formatSize(1024)).toBe("1.00 KB"); // KB
  expect(formatSize(1048576)).toBe("1.00 MB"); // MB
  expect(formatSize(-100)).toThrow(); // error case
  expect(formatSize("abc")).toThrow(); // invalid input
});
```

## CI/CD Integration

### GitHub Actions

The coverage report can be published to GitHub:

```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: pnpm test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

### Coverage Reports in PRs

Display coverage in pull request comments:

```yaml
- name: Comment coverage on PR
  uses: 5monkeys/cobertura-action@master
  with:
    path: coverage/cobertura-coverage.xml
```

## Troubleshooting

### "Module not found" errors

The project uses ES modules. Ensure `jest.config.js` has:

```javascript
export default {
  /* ... */
};
```

### Coverage not updating

Clear the coverage cache:

```bash
rm -rf coverage/
pnpm test:coverage
```

### Browser not opening

If the HTML report doesn't open automatically:

```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# Windows (Git Bash)
start coverage/index.html
```

### Low coverage warnings

If tests report coverage below 80% threshold:

1. Check which files need more tests:

   ```bash
   cat coverage/coverage-summary.json | grep -v total
   ```

2. Add tests for those files:

   ```bash
   pnpm test:watch -- path/to/file.test.js
   ```

3. Rerun coverage:
   ```bash
   pnpm test:coverage
   ```

## Files Generated

```
coverage/
├── index.html              # Interactive HTML report (open in browser)
├── coverage-summary.json   # Summary metrics
├── coverage-final.json     # Detailed coverage data
├── lcov.info              # LCOV format (for tools like Codecov)
└── [files]/               # Per-file coverage details
    └── index.html         # Individual file coverage report
```

## Related Commands

```bash
pnpm test                   # Run all tests (no coverage)
pnpm test:watch            # Run tests in watch mode
pnpm test:coverage         # Run tests + generate coverage report
pnpm lint                  # Check code style
pnpm format                # Format all files
```

## See Also

- [AGENTS.md](../AGENTS.md) - Testing guidelines and patterns
- [jest.config.js](../jest.config.js) - Jest configuration
- [**tests**/](../__tests__/) - Test files

---

For more information, see the [Jest Coverage documentation](https://jestjs.io/docs/coverage).
