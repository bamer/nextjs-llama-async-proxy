# Coverage Quick Start

## 🚀 One Command to Rule Them All

```bash
pnpm test:coverage
```

Done. Your coverage report opens automatically.

## 📊 What You'll See

**Terminal:**

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

File Coverage:

   86.5%  server.js
   89.2%  server/db.js
   85.1%  public/js/utils/validation.js
```

**Browser:**

- Interactive HTML report opens automatically
- Click files to see line-by-line coverage
- Green = tested, Red = untested

## 🎯 Common Tasks

### View the HTML report manually

```bash
open coverage/index.html
```

### See which files need more tests

```bash
cat coverage/coverage-summary.json | grep -v total
```

### Watch and re-run tests

```bash
pnpm test:watch
```

### Just run tests (no coverage)

```bash
pnpm test
```

## 🎨 VSCode Inline Coverage Display

1. Install "Coverage Gutters" extension (recommended)
2. Open any `.js` file
3. Press **Cmd+Shift+P** (or Ctrl+Shift+P on Linux/Windows)
4. Type: `Coverage Gutters: Display Coverage`
5. See green/red highlights for covered/uncovered code

## 🔍 What the Colors Mean

**Terminal percentages:**

- 🟢 Green (≥90%) = Excellent coverage
- 🟡 Yellow (≥80%) = Good coverage
- 🔴 Red (<80%) = Needs improvement

**VSCode Coverage Gutters:**

- 🟢 Green highlight = Code is tested
- 🔴 Red highlight = Code is not tested
- 🟡 Yellow highlight = Branch not tested

## 📈 Coverage Goals

Minimum thresholds:

- **Lines**: 80%
- **Statements**: 80%
- **Functions**: 80%
- **Branches**: 80%

## 💡 Tips

- Run coverage before committing code
- Use the HTML report to find untested code
- Use VSCode Coverage Gutters to see coverage while coding
- Aim for >90% on critical files (validation, database, handlers)

## 🚨 If Tests Fail

The coverage report still generates! You'll see:

- Which tests failed
- Coverage metrics anyway (so you can see progress)
- Both on screen and in HTML report

## 📚 Full Guide

See [docs/COVERAGE_GUIDE.md](docs/COVERAGE_GUIDE.md) for:

- Installing VSCode extensions
- CI/CD integration
- Coverage improvement strategies
- Troubleshooting

---

**That's it!** Run `pnpm test:coverage` and enjoy your reports.
