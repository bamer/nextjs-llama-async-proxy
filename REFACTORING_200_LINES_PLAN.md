# 🎯 REFACTORING PLAN - Files Over 200 Lines
## Mission: Reduce file complexity for better maintainability

**Pipeline ID:** REFACTOR-2025-12-31-001
**Created:** 2025-12-31
**Status:** PENDING
**Note:** Excludes files in .gitignore and hidden directories (.opencode, .beads, etc.)

---

## 📊 Current State Analysis

### Files Over 200 Lines: 278 total
```
🔴 Critical (500+ lines):     94 files  (34%)
🟡 High (300-499 lines):     105 files  (38%)
🟢 Medium (200-299 lines):     79 files  (28%)
```

### Top 10 Largest Files (Production Code)
1. `app/models/page.tsx` - 1,167 lines
2. `src/lib/database/models-service.ts` - 1,088 lines
3. `src/components/ui/ModelConfigDialog.tsx` - 1,086 lines
4. `src/server/services/LlamaServerIntegration.ts` - 916 lines
5. `src/config/tooltip-config.ts` - 769 lines
6. `src/lib/database/database-client.ts` - 509 lines
7. `server.js` - 501 lines

### Largest Test Files (Top 5)
1. `__tests__/server/services/LlamaService.comprehensive.test.ts` - 1,255 lines
2. `__tests__/components/dashboard/ModelsListCard.test.tsx` - 1,104 lines
3. `__tests__/components/pages/ModelsPage.test.tsx` - 988 lines
4. `__tests__/components/configuration/LoggerSettingsTab.test.tsx` - 931 lines
5. `__tests__/api/models-start.test.ts` - 912 lines

---

## 🎯 Refactoring Strategy

### Guiding Principles

1. **Composition over Monoliths** - Break large files into smaller, focused modules
2. **Single Responsibility** - Each file/module should have one clear purpose
3. **Test Coverage Preservation** - Refactor without breaking existing tests
4. **Incremental Approach** - Phased rollout to minimize risk

### Common Patterns for Splitting Files

#### Components > 200 lines:
```
Before:
  MyLargeComponent.tsx (450 lines)

After:
  MyLargeComponent.tsx         (main component, < 200 lines)
  MyLargeComponent.types.ts   (type definitions)
  MyLargeComponent.utils.ts    (helper functions)
  MyLargeComponent.hooks.ts    (custom hooks)
  MyLargeComponent/            (if needs sub-components)
    ├── SubComponentA.tsx
    ├── SubComponentB.tsx
    └── index.ts
```

#### Services > 200 lines:
```
Before:
  LargeService.ts (800 lines)

After:
  services/
    ├── index.ts                  (main exports)
    ├── core/
    │   ├── LargeService.ts       (core logic)
    │   └── LargeService.types.ts
    ├── modules/
    │   ├── featureA.service.ts
    │   ├── featureB.service.ts
    │   └── featureC.service.ts
    └── utils/
        ├── helperA.ts
        └── helperB.ts
```

#### Test Files > 200 lines:
```
Before:
  MyComponent.test.tsx (600 lines)

After:
  MyComponent.test.tsx              (happy path tests)
  MyComponent.edge-case.test.tsx    (edge cases)
  MyComponent.integration.test.tsx   (integration tests)
  MyComponent.coverage.test.tsx     (coverage tests)
  MyComponent.snapshots.test.tsx    (snapshot tests)
```

---

## 📋 PHASE 1: Critical Production Files (Week 1-2)
**Priority:** CRITICAL
**Target:** 7 largest production files
**Goal:** Reduce to < 200 lines each

### Files to Refactor:
1. ✅ `app/models/page.tsx` (1,167 → < 200 lines)
   - Extract: `ModelsListCard`, `ModelGrid`, `ModelSearchBar`, `ModelFilters`
   - Extract: `useModels`, `useModelFilters` hooks
   - Extract: `model-utils.ts` for helper functions

2. ✅ `src/lib/database/models-service.ts` (1,088 → < 200 lines)
   - Split into: `models-core.ts`, `models-crud.ts`, `models-search.ts`
   - Extract: `models.types.ts`, `models.utils.ts`
   - Extract: query builders to separate module

3. ✅ `src/components/ui/ModelConfigDialog.tsx` (1,086 → < 200 lines)
   - Create: `ModelConfigDialog/` folder with sub-components
   - Extract: `FitParamsTab`, `AdvancedTab`, `SystemPromptTab`
   - Extract: `useModelConfigForm` hook
   - Extract: `model-config.types.ts`, `model-config.utils.ts`

4. ✅ `src/server/services/LlamaServerIntegration.ts` (916 → < 200 lines)
   - Split into: `ServerCore`, `ServerProcess`, `ServerWebSocket`
   - Extract: `server.types.ts`, `server.utils.ts`, `server.constants.ts`
   - Create: `modules/` for feature-specific logic

5. ✅ `src/config/tooltip-config.ts` (769 → < 200 lines)
   - Split by category: `metrics-tooltips.ts`, `model-tooltips.ts`, `ui-tooltips.ts`
   - Create: `tooltip-config.types.ts` for type definitions

6. ✅ `src/lib/database/database-client.ts` (509 → < 200 lines)
   - Extract: connection pooling to `connection-pool.ts`
   - Extract: query helpers to `query-helpers.ts`
   - Extract: type definitions to `database.types.ts`

7. ✅ `server.js` (501 → < 200 lines)
   - Convert to TypeScript: `server.ts`
   - Split into: `server.ts`, `routes/`, `middleware/`, `config/`
   - Extract: server setup logic to separate modules

---

## 📋 PHASE 2: High Priority Files (Week 3-4)
**Priority:** HIGH
**Target:** 15-20 production files (300-499 lines)
**Goal:** Reduce to < 200 lines each

### Production Files (300-499 lines):
- All remaining `src/` files in this range
- Focus on: components, hooks, services, lib

### Test Files (500+ lines - Critical Tests):
1. `__tests__/server/services/LlamaService.comprehensive.test.ts` (1,255)
2. `__tests__/components/dashboard/ModelsListCard.test.tsx` (1,104)
3. `__tests__/components/pages/ModelsPage.test.tsx` (988)
4. `__tests__/components/configuration/LoggerSettingsTab.test.tsx` (931)
5. `__tests__/api/models-start.test.ts` (912)

---

## 📋 PHASE 3: Medium Priority Files (Week 5-6)
**Priority:** MEDIUM
**Target:** 50-60 files (200-499 lines)
**Goal:** Reduce to < 200 lines each

### Remaining Test Files:
- All `__tests__/` files in 200-499 range
- Focus on splitting by test type (unit, integration, edge cases, snapshots)

---

## 📋 PHASE 4: Completion (Week 7-8)
**Priority:** LOW
**Target:** Remaining ~140 files
**Goal:** Ensure ALL files < 200 lines

### Validation:
- Run file size analysis again
- Verify no file > 200 lines
- Document any exceptions with justification

---

## 🔄 Workflow Per File

### Step 1: Analysis (Coder-Agent)
```bash
# Before refactoring
pnpm test <file>           # Ensure tests pass
pnpm type:check            # No TS errors
```

### Step 2: Refactoring (Coder-Agent)
1. Extract types to `*.types.ts`
2. Extract utilities to `*.utils.ts`
3. Extract constants to `*.constants.ts`
4. Split components/services into logical modules
5. Update imports across project
6. Run `pnpm lint:fix` to auto-format

### Step 3: Verification (Tester-Agent)
```bash
# After refactoring
pnpm test <related-tests>  # Ensure tests still pass
pnpm type:check            # No new TS errors
pnpm lint                  # No linting errors
```

### Step 4: Review (Reviewer-Agent)
- Code review: readability, maintainability
- Verify all imports resolve correctly
- Check no circular dependencies
- Ensure naming conventions followed

---

## 📊 Success Metrics

### Quantitative Goals:
- ✅ **100%** of production files < 200 lines
- ✅ **95%** of test files < 200 lines (5% exceptions allowed for comprehensive tests)
- ✅ **0** TypeScript errors after refactoring
- ✅ **0** broken tests after refactoring
- ✅ **70%+** test coverage maintained

### Qualitative Goals:
- Improved code readability
- Better code organization
- Easier onboarding for new developers
- Reduced cognitive load per file

---

## 🛠️ Agent Assignments

### Orchestrator
- Coordinate all phases
- Track progress
- Handle dependencies
- Emit final summary token

### Coder-Agent (Primary)
- Perform all refactoring work
- Split files according to patterns
- Update imports
- Ensure type safety

### Reviewer-Agent
- Review each refactored file
- Verify file size < 200 lines
- Check for breaking changes
- Approve or reject changes

### Tester-Agent
- Run test suites after each batch
- Verify coverage maintained
- Check for regressions
- Report test failures

### Docs-Agent
- Document new file structures
- Update architecture diagrams
- Create refactoring guidelines
- Document any patterns used

---

## ⚠️ Risk Mitigation

### High Risk Areas:
1. **Large test files** - Splitting may break test isolation
   - Mitigation: Run tests after each split, verify no side effects

2. **Cyclic dependencies** - New module structure may create cycles
   - Mitigation: Use dependency graph analysis, review imports carefully

3. **Import path updates** - Risk of missing imports after split
   - Mitigation: Automated import checking, IDE validation

4. **Server files** - Runtime errors possible
   - Mitigation: Test server startup after each refactoring

### Rollback Strategy:
- Git commits per file refactoring
- Ability to revert any individual file
- Main branch protected, require review

---

## 📝 Deliverables

### Phase 1 Deliverables:
- [ ] 7 critical files refactored
- [ ] All tests passing
- [ ] Type check passing
- [ ] Documentation updated

### Phase 2 Deliverables:
- [ ] 15-20 high priority files refactored
- [ ] 5 critical test files split
- [ ] All tests passing
- [ ] Coverage >= 70%

### Phase 3 Deliverables:
- [ ] 50-60 medium priority files refactored
- [ ] All tests passing
- [ ] Zero TypeScript errors

### Phase 4 Deliverables:
- [ ] All files < 200 lines (with documented exceptions)
- [ ] Final audit report
- [ ] Refactoring guidelines document

---

## 🚀 Execution Plan

### Week 1-2: Phase 1
- Day 1-2: `app/models/page.tsx`
- Day 3-4: `src/lib/database/models-service.ts`
- Day 5-6: `src/components/ui/ModelConfigDialog.tsx`
- Day 7-8: `src/server/services/LlamaServerIntegration.ts`
- Day 9-10: `src/config/tooltip-config.ts`
- Day 11-12: `src/lib/database/database-client.ts`
- Day 13-14: `server.js`

### Week 3-4: Phase 2
- Production files: 3-4 per day
- Test files: 1 per day (more complex)

### Week 5-6: Phase 3
- Test files: 5-6 per day
- Configuration files: as needed

### Week 7-8: Phase 4
- Complete remaining files
- Final validation
- Documentation

---

## 📌 Notes & Considerations

### Exceptions to < 200 lines Rule:
1. **Comprehensive test suites** - May justify keeping comprehensive tests together
2. **External dependencies** - Files outside project scope excluded
3. **Generated code** - Auto-generated files exempt
4. **Hidden directories** - Files in `.opencode`, `.beads`, etc. excluded

### Naming Conventions for Split Files:
- Types: `*.types.ts` or `types.ts`
- Utils: `*.utils.ts` or `utils.ts`
- Constants: `*.constants.ts` or `constants.ts`
- Hooks: `use*.ts`
- Components: `PascalCase.tsx`
- Index files: `index.ts` or `index.tsx`

### Import Path Updates:
```bash
# Update all imports pointing to refactored file
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "OldImportPath" | xargs sed -i 's|OldImportPath|NewImportPath|g'
```

---

## ✅ Acceptance Criteria

**Mission Complete When:**
- ✅ 0 production files > 200 lines
- ✅ < 5% test files > 200 lines (with documented justification)
- ✅ All tests passing
- ✅ TypeScript type check passing (0 errors)
- ✅ Linting passing (0 errors)
- ✅ Coverage >= 70%
- ✅ Documentation updated
- ✅ Final audit report generated

---

## 🎯 Next Steps

1. **Approve this plan** - Review and approve refactoring strategy
2. **Initialize workspace** - Set up working directory for refactoring
3. **Dispatch Phase 1** - Start with critical production files
4. **Track progress** - Update orchestrator state after each file
5. **Validate** - Run tests and type checks after each phase
6. **Document** - Update architecture and guidelines

---

**Prepared by:** Orchestrator Agent
**Pipeline ID:** REFACTOR-2025-12-31-001
**Estimated Duration:** 8 weeks
**Risk Level:** MEDIUM
**Confidence Level:** HIGH
