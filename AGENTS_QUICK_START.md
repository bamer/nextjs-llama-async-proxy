# Quick Start Guide for AGENTS 2-5
## 30-Second Setup to Start Testing

---

## 🟢 AGENT 2: SERVER SERVICES

```bash
# 1. Read the instructions (5 min)
less AGENT2_3_4_5_INSTRUCTIONS.md   # Jump to "AGENT 2:" section

# 2. Review examples (5 min)
less AGENT1_COMPLETION_REPORT.md
less __tests__/lib/agent1-core-enhancement.test.ts

# 3. Create test file
mkdir -p __tests__/services
touch __tests__/services/agent2-services.test.ts

# 4. Start with first file: src/server/services/LlamaService.ts
# - Read the source file
# - Plan test structure (initialization, methods, errors)
# - Write tests
# - Run: pnpm test __tests__/services/agent2-services.test.ts

# 5. Repeat for each file in your list
```

**Target Files:**
- `src/server/services/LlamaService.ts`
- `src/server/services/LlamaServerIntegration.ts`
- `src/services/api-service.ts`
- `src/lib/services/ModelDiscoveryService.ts`
- `src/lib/services/parameterService.ts`
- `src/lib/ollama.ts`
- `src/lib/api-client.ts`
- `src/lib/websocket-transport.ts`

**Tests Needed:** 40-50  
**Duration:** 1-2 weeks

---

## 🟡 AGENT 3: DASHBOARD COMPONENTS

```bash
# 1. Read the instructions (5 min)
less AGENT2_3_4_5_INSTRUCTIONS.md   # Jump to "AGENT 3:" section

# 2. Review examples (5 min)
less AGENT1_COMPLETION_REPORT.md
less __tests__/lib/agent1-core-enhancement.test.ts  # Store tests show component patterns

# 3. Create test file
mkdir -p __tests__/components
touch __tests__/components/agent3-dashboard.test.ts

# 4. Start with first component: src/components/dashboard/MetricCard.tsx
# - Read the source component
# - Plan test categories (render, props, events, states)
# - Write tests for all scenarios
# - Run: pnpm test __tests__/components/agent3-dashboard.test.ts

# 5. Repeat for each dashboard component (25+)
```

**Target Directory:**
`src/components/dashboard/` (25+ components)

**Tests Needed:** 100-150  
**Duration:** 2-3 weeks

---

## 🟠 AGENT 4: LAYOUT & PAGES

```bash
# 1. Read the instructions (5 min)
less AGENT2_3_4_5_INSTRUCTIONS.md   # Jump to "AGENT 4:" section

# 2. Review examples (5 min)
less AGENT1_COMPLETION_REPORT.md
less __tests__/lib/agent1-core-enhancement.test.ts

# 3. Create test file
mkdir -p __tests__/pages
touch __tests__/pages/agent4-layout-pages.test.ts

# 4. Start with first layout: src/components/layout/Header.tsx
# - Read the source component
# - Plan test categories (render, nav, responsive, integration)
# - Write tests
# - Run: pnpm test __tests__/pages/agent4-layout-pages.test.ts

# 5. Move to pages (app/page.tsx, app/dashboard/page.tsx, etc.)
# - Test page rendering
# - Test data fetching
# - Test navigation
```

**Target Files:**
- Layout: Header, Sidebar, NavBar, Footer (4)
- Pages: main page, dashboard, models, logs, settings (5+)
- All others (10+)

**Tests Needed:** 60-80  
**Duration:** 2 weeks

---

## 🔴 AGENT 5: CONFIG/UTILS/UI

```bash
# 1. Read the instructions (5 min)
less AGENT2_3_4_5_INSTRUCTIONS.md   # Jump to "AGENT 5:" section

# 2. Review examples (5 min)
less AGENT1_COMPLETION_REPORT.md
less __tests__/lib/agent1-core-enhancement.test.ts

# 3. Create test file
mkdir -p __tests__/utils
touch __tests__/utils/agent5-config-utils.test.ts

# 4. Start with config: src/config/app.config.ts
# - Read the source config
# - Plan test categories (loading, defaults, validation)
# - Write tests
# - Run: pnpm test __tests__/utils/agent5-config-utils.test.ts

# 5. Move to validators: src/lib/validators.ts
# - Test all validation functions
# - Test edge cases (null, empty, invalid)
# - Test error messages

# 6. Move to UI components: src/components/ui/Button.tsx, etc.
# - Test rendering
# - Test props
# - Test events
# - Test variants/states

# 7. Move to utilities: src/utils/*.ts
# - Test all utility functions
# - Test edge cases
```

**Target Files:**
- Config (3): app.config.ts, monitoring.config.ts, llama-defaults.ts
- Utils (5+): validators, error-handler, analytics, string utils, etc.
- UI Components (6): Button, Input, Modal, Card, Tabs, ErrorBoundary
- Other utilities

**Tests Needed:** 80-100  
**Duration:** 1-2 weeks

---

## 📚 ESSENTIAL COMMANDS

### Run Your Tests
```bash
# Run specific test file (use this A LOT)
pnpm test __tests__/services/agent2-services.test.ts

# Run in watch mode (auto-reruns on save)
pnpm test:watch __tests__/services/agent2-services.test.ts

# Run with verbose output
pnpm test --verbose __tests__/services/agent2-services.test.ts
```

### Quality Checks
```bash
# Type check
pnpm type:check

# Lint
pnpm lint
pnpm lint:fix   # Auto-fix issues

# Test coverage for your files
pnpm test:coverage __tests__/services/agent2-services.test.ts
```

### Build & Full Test
```bash
# Build
pnpm build

# Full test suite
pnpm test
```

---

## 🎯 TEST WRITING CHECKLIST

Before submitting tests, verify:

- [ ] **Reads Source** - I've read the file being tested
- [ ] **Tests Happy Path** - Basic functionality works
- [ ] **Tests Errors** - Error cases handled
- [ ] **Tests Edge Cases** - Null, empty, boundary conditions
- [ ] **Uses Mocks** - External dependencies mocked
- [ ] **Uses act()** - State changes wrapped in act()
- [ ] **Follows AGENTS.md** - Code style compliant
- [ ] **No `any` types** - All types specific
- [ ] **Clear Names** - Test names describe what's tested
- [ ] **100% Pass** - All tests passing locally
- [ ] **98% Coverage** - Each file at 98%+

---

## 🛠️ DEBUGGING FAILED TESTS

### Test Fails to Run
```bash
# Check syntax
pnpm lint __tests__/services/agent2-services.test.ts

# Check types
pnpm type:check

# Check imports
node -c __tests__/services/agent2-services.test.ts
```

### Test Assertion Fails
- Read the error message carefully
- Run with `--verbose` flag
- Use `console.log()` to debug
- Check mock return values
- Verify `act()` wrapper usage

### Coverage Gap
- Check which lines uncovered
- Add test for that code path
- Test both success and error branches
- Verify boundary conditions

---

## 📖 REFERENCE PATTERNS

### Jest Mock Pattern
```typescript
jest.mock('module-name');
const mockedModule = module-name as jest.Mocked<typeof module-name>;

mockedModule.function.mockReturnValue(value);
```

### Zustand Store Test Pattern
```typescript
import { useStore } from '@/lib/store';
import { act } from '@testing-library/react';

act(() => {
  useStore.getState().setModels([...]);
});

expect(useStore.getState().models).toEqual([...]);
```

### React Hook Test Pattern
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

const { result } = renderHook(() => useMyHook());

await waitFor(() => {
  expect(result.current.data).toBeDefined();
});
```

### Component Test Pattern
```typescript
import { render } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

const { getByText } = render(<MyComponent prop="value" />);
expect(getByText('Expected Text')).toBeInTheDocument();
```

---

## 📞 HELP & SUPPORT

### Read These Files First
1. `AGENTS.md` - Code style guidelines
2. `AGENT2_3_4_5_INSTRUCTIONS.md` - Your agent's detailed instructions
3. `AGENT1_COMPLETION_REPORT.md` - Example test patterns
4. `__tests__/lib/agent1-*.test.ts` - Working code examples

### Common Issues

**"Module not found"**
- Check import path (use @/ alias)
- Verify file exists
- Check jest.config.ts for module resolution

**"Cannot find name 'xxx'"**
- Check TypeScript strict mode
- Add type imports if needed
- Verify interface is exported

**"Test times out"**
- Check mock is resolving
- Increase timeout: `jest.setTimeout(10000)`
- Verify async/await usage

**"State not updating"**
- Wrap state changes in `act()`
- Use `waitFor()` for async updates
- Check mock return values

---

## ⏱️ TIME ESTIMATES

| Task | Time |
|------|------|
| Read instructions | 5 min |
| Review examples | 5 min |
| Read one source file | 10 min |
| Write tests for one file | 20-40 min |
| Debug/fix tests | 10-20 min |
| **Total per file** | **50-70 min** |

---

## 🚀 TODAY'S ACTIONS

### Right Now:
1. ✅ Open this file
2. ✅ Read the section for your agent number
3. ✅ Copy the commands
4. ✅ Create your test file
5. ✅ Read first source file

### First Hour:
1. Read AGENT2_3_4_5_INSTRUCTIONS.md (your agent)
2. Review AGENT1_COMPLETION_REPORT.md
3. Study `__tests__/lib/agent1-core-enhancement.test.ts`
4. Create test file
5. Write first 3 tests for your first file

### First Day:
1. Complete tests for first file
2. Achieve 98%+ coverage on that file
3. Commit/push changes
4. Start second file
5. Update PARALLEL_TESTING_PROGRESS.md

---

## 📝 PROGRESS TEMPLATE

Save this in a comment at top of your test file:

```typescript
/**
 * AGENT X Test Suite
 * ==================
 * Progress: X files done, Y files in progress, Z files remaining
 * Tests: ABC tests created, DEF tests passing
 * Coverage: GHI%
 * 
 * Completed Files: [list]
 * In Progress: [file]
 * Next: [file]
 * 
 * Last Update: YYYY-MM-DD
 */
```

---

## ✅ DEFINITION OF DONE

Your tests are ready when:
- [ ] All assertions pass (`pnpm test`)
- [ ] No console errors/warnings
- [ ] 98%+ statement coverage
- [ ] 98%+ branch coverage
- [ ] 98%+ function coverage
- [ ] Edge cases tested
- [ ] Error paths tested
- [ ] Code follows AGENTS.md style
- [ ] No `any` types used
- [ ] Tests are deterministic

---

## 🎯 YOU'RE READY!

You have everything needed:
✅ Documentation  
✅ Instructions  
✅ Example code  
✅ Test patterns  
✅ Commands  
✅ Quick reference  

**Let's achieve 98% coverage! 🚀**

---

**Document:** Quick Start Guide  
**Updated:** 2024-12-27  
**For:** AGENTS 2, 3, 4, 5  
**Status:** Ready to Execute
