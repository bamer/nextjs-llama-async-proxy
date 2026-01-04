# 🎯 REFACTORING 200 LINES LIMIT - TASK FORCE PLAN

## 📊 Executive Summary

**Current State**: 18 production files exceed the 200-line limit (range: 202-390 lines)
**Goal**: Refactor all files to ≤ 200 lines for maintainability
**Estimated Effort**: 3-4 weeks with parallel task execution

---

## 📋 Files to Refactor (Priority Order)

### 🔴 CRITICAL PRIORITY (> 350 lines)
| # | File | Lines | Category | Dependencies |
|---|------|-------|----------|--------------|
| 1 | `src/services/model-config-service.ts` | 390 | Service | High - used everywhere |

### 🟠 HIGH PRIORITY (> 250 lines)
| # | File | Lines | Category | Dependencies |
|---|------|-------|----------|--------------|
| 2 | `src/server/services/fit-params-service.ts` | 277 | Server Service | Medium |
| 3 | `src/lib/validators/api.validator.ts` | 277 | Validator | Low |
| 4 | `src/components/dashboard/MemoizedModelItem.tsx` | 272 | Component | High |
| 5 | `src/lib/validators/server-config.validator.ts` | 267 | Validator | Low |
| 6 | `src/lib/validators/model-config.validator.ts` | 265 | Validator | Low |
| 7 | `src/components/pages/ModelsPage.tsx` | 254 | Page Component | High |
| 8 | `src/config/model-field-definitions.ts` | 252 | Config Data | Low |
| 9 | `src/components/pages/MonitoringPage.tsx` | 250 | Page Component | High |

### 🟡 MEDIUM PRIORITY (> 200 lines)
| # | File | Lines | Category | Dependencies |
|---|------|-------|----------|--------------|
| 10 | `src/types/model-types.ts` | 249 | Types | Low |
| 11 | `src/lib/database/schemas/model-schemas.ts` | 242 | Database Schema | Medium |
| 12 | `src/components/ui/ConfigFields.tsx` | 233 | UI Component | Medium |
| 13 | `src/components/ui/ConfigTypeSelector.tsx` | 229 | UI Component | Medium |
| 14 | `src/components/ui/error-fallbacks.tsx` | 224 | UI Component | Low |
| 15 | `src/config/ui-tooltips.ts` | 222 | Config Data | Low |
| 16 | `src/config/sampling-tooltips.ts` | 220 | Config Data | Low |
| 17 | `src/config/model-config-sections.ts` | 220 | Config Data | Low |
| 18 | `src/components/ui/MultiSelect.tsx` | 219 | UI Component | Medium |

---

## 🚀 Task Force Organization

### Roles & Responsibilities

#### 1. **Orchestrator Agent** (Primary)
- Mission planning and coordination
- Task distribution to specialized agents
- Dependency management
- Progress tracking
- Final validation

#### 2. **Coder Agents** (3 parallel teams)
- **Team A - Services**: Server-side refactoring (fit-params-service, model-config-service)
- **Team B - Components**: UI components and pages
- **Team C - Validators & Config**: Validators and configuration files

#### 3. **Reviewer Agent**
- Code quality checks
- Lint/type-check validation
- Architecture review
- MUI v8 compliance

#### 4. **Tester Agent**
- Test coverage verification
- Regression testing
- Integration testing

#### 5. **Docs Agent**
- Update documentation
- Refactoring notes
- Architecture diagrams

---

## 📐 Refactoring Strategy by Category

### 1. **Services** (Split by Responsibility)
**Pattern**: Extract methods into dedicated utility files

```typescript
// Before: model-config-service.ts (390 lines)
export class ModelConfigService {
  // 15+ methods mixed together
}

// After:
// model-config-service.ts (main entry, ~150 lines)
// services/model-config-validators.ts (~80 lines)
// services/model-config-converters.ts (~90 lines)
// services/model-config-persistence.ts (~100 lines)
```

### 2. **Components** (Composition Pattern)
**Pattern**: Extract sub-components and custom hooks

```typescript
// Before: MemoizedModelItem.tsx (272 lines)
export function MemoizedModelItem({ model }) {
  // Large component with multiple concerns
}

// After:
// MemoizedModelItem.tsx (~120 lines) - Main component
// components/model-item/ModelItemHeader.tsx (~60 lines)
// components/model-item/ModelItemActions.tsx (~50 lines)
// components/model-item/ModelItemStats.tsx (~40 lines)
// hooks/use-model-item.ts (~80 lines)
```

### 3. **Validators** (Schema-based Extraction)
**Pattern**: Extract validation schemas into separate files

```typescript
// Before: api.validator.ts (277 lines)
export const apiSchema = {
  // Large Zod schema with many nested objects
};

// After:
// validators/schemas/api-schemas.ts (main entry, ~100 lines)
// validators/schemas/api-request-schemas.ts (~80 lines)
// validators/schemas/api-response-schemas.ts (~60 lines)
// validators/schemas/api-error-schemas.ts (~50 lines)
```

### 4. **Pages** (Sub-component Extraction)
**Pattern**: Extract sections into dedicated components

```typescript
// Before: ModelsPage.tsx (254 lines)
export default function ModelsPage() {
  // Page with multiple sections
}

// After:
// ModelsPage.tsx (~120 lines) - Layout + coordination
// pages/models/ModelListSection.tsx (~80 lines)
// pages/models/ModelControlsSection.tsx (~60 lines)
// pages/models/ModelFiltersSection.tsx (~50 lines)
```

### 5. **Config Data** (Logical Grouping)
**Pattern**: Split by domain/feature

```typescript
// Before: model-field-definitions.ts (252 lines)
export const MODEL_FIELDS = {
  // 40+ field definitions
};

// After:
// config/fields/model-basic-fields.ts (~80 lines)
// config/fields/model-inference-fields.ts (~70 lines)
// config/fields/model-quantization-fields.ts (~60 lines)
// config/fields/model-advanced-fields.ts (~50 lines)
```

---

## 🎯 Phased Execution Plan

### **Phase 1: Critical Services** (Days 1-3)
**Objective**: Refactor the most critical service (model-config-service.ts)

- Task 1.1: Extract validation logic → `model-config-validators.ts`
- Task 1.2: Extract converters → `model-config-converters.ts`
- Task 1.3: Extract persistence logic → `model-config-persistence.ts`
- Task 1.4: Update main service file to use extracted modules
- Task 1.5: Update all imports across the codebase
- Task 1.6: Run tests and fix any breakages
- Task 1.7: Code review and validation

### **Phase 2: Validators & Config** (Days 4-6)
**Objective**: Refactor all validators and config files

- Task 2.1: Refactor `api.validator.ts` (split into request/response/error schemas)
- Task 2.2: Refactor `server-config.validator.ts` (extract nested schemas)
- Task 2.3: Refactor `model-config.validator.ts` (extract field validators)
- Task 2.4: Split `model-field-definitions.ts` by category
- Task 2.5: Split `ui-tooltips.ts` by UI section
- Task 2.6: Split `sampling-tooltips.ts` by parameter type
- Task 2.7: Split `model-config-sections.ts` by feature
- Task 2.8: Update imports and run tests
- Task 2.9: Code review

### **Phase 3: UI Components** (Days 7-10)
**Objective**: Refactor large UI components

- Task 3.1: Refactor `MemoizedModelItem.tsx` (extract sub-components)
- Task 3.2: Refactor `ConfigFields.tsx` (extract field types)
- Task 3.3: Refactor `ConfigTypeSelector.tsx` (extract selector types)
- Task 3.4: Refactor `error-fallbacks.tsx` (extract fallback types)
- Task 3.5: Refactor `MultiSelect.tsx` (extract utility functions)
- Task 3.6: Update component imports
- Task 3.7: Run UI tests and visual regression
- Task 3.8: Code review

### **Phase 4: Page Components** (Days 11-13)
**Objective**: Refactor page-level components

- Task 4.1: Refactor `ModelsPage.tsx` (extract sections)
- Task 4.2: Refactor `MonitoringPage.tsx` (extract sections)
- Task 4.3: Extract shared page logic into hooks
- Task 4.4: Update routing and navigation
- Task 4.5: Run E2E tests
- Task 4.6: Code review

### **Phase 5: Server Services & Database** (Days 14-16)
**Objective**: Refactor server-side code

- Task 5.1: Refactor `fit-params-service.ts` (extract validators, converters)
- Task 5.2: Refactor `model-schemas.ts` (split by model type)
- Task 5.3: Update server imports
- Task 5.4: Run integration tests
- Task 5.5: Code review

### **Phase 6: Types & Final Cleanup** (Days 17-18)
**Objective**: Final type definitions and cleanup

- Task 6.1: Refactor `model-types.ts` (split by domain)
- Task 6.2: Update all type imports
- Task 6.3: Remove any dead code
- Task 6.4: Final full test suite run
- Task 6.5: Code review

### **Phase 7: Documentation & Validation** (Days 19-21)
**Objective**: Documentation and final validation

- Task 7.1: Update architecture documentation
- Task 7.2: Document refactoring changes
- Task 7.3: Update README with new file structure
- Task 7.4: Run full test suite with coverage
- Task 7.5: Generate refactoring summary report

---

## 🔄 Parallel Execution Strategy

### Parallel Teams (3 Teams × 3 Phases)

| Week | Team A (Services) | Team B (Components) | Team C (Validators/Config) |
|------|-------------------|---------------------|---------------------------|
| Week 1 | Phase 1 (model-config-service) | Phase 3 (UI Components - part 1) | Phase 2 (Validators - part 1) |
| Week 2 | Phase 5 (fit-params-service) | Phase 3 (UI Components - part 2) | Phase 2 (Validators - part 2) |
| Week 3 | Phase 5 (Database schemas) | Phase 4 (Page Components) | Phase 2 (Config files) |

### Dependency Graph

```
Phase 1 (model-config-service)
    ↓
Phase 2 (validators) → Phase 5 (server services)
    ↓
Phase 3 (components) → Phase 4 (pages)
    ↓
Phase 6 (types) → Phase 7 (docs)
```

---

## ✅ Success Criteria

### For Each Refactored File
1. ✅ File length ≤ 200 lines
2. ✅ All tests pass (pnpm test)
3. ✅ Type checking passes (pnpm type:check)
4. ✅ Linting passes (pnpm lint)
5. ✅ No breaking changes to public API
6. ✅ Code review approved

### Overall Project Metrics
1. ✅ All 18 files ≤ 200 lines
2. ✅ Test coverage ≥ 70% (current threshold)
3. ✅ No regressions in E2E tests
4. ✅ Documentation updated
5. ✅ Build succeeds (pnpm build)

---

## 🛠️ Tooling & Automation

### Automated Checks (Pre-commit)
- Line count validation (max 200 lines)
- TypeScript strict mode
- ESLint with project rules
- MUI v8 compliance
- Test coverage threshold

### Script: `scripts/check-line-count.sh`
```bash
#!/bin/bash
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 200 ]; then
    echo "ERROR: $file has $lines lines (max 200)"
    exit 1
  fi
done
```

---

## 📊 Progress Tracking

### Dashboard Metrics
- Files Refactored: 0/18
- Total Lines Saved: 0
- Average File Size: 0 lines
- Tests Passing: 0%
- Type Check: ❌

### Weekly Reports
Each phase completion triggers a status report with:
- Files completed
- Lines reduced
- Test results
- Issues encountered
- Next steps

---

## 🚨 Risk Mitigation

### Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking API changes | Medium | High | Maintain backward compatibility adapters |
| Test failures | High | Medium | Incremental testing after each file |
| Import cascades | Medium | Medium | Batch import updates per phase |
| Time overrun | Medium | Low | Prioritize critical files first |
| Merge conflicts | Low | Medium | Use feature branches per team |

---

## 🎯 Next Steps

### Immediate Actions (Today)
1. ✅ Review and approve this plan
2. ✅ Set up workspace with TODO list
3. ✅ Create feature branches for each team
4. ✅ Initialize orchestrator audit log

### This Week (Days 1-3)
1. ✅ Start Phase 1 (model-config-service)
2. ✅ Parallel: Start Phase 3 part 1 (UI Components)
3. ✅ Parallel: Start Phase 2 part 1 (Validators)
4. ✅ Daily progress syncs

---

## 📝 Notes

- **No file deletions**: All extracted files are new, original files are refactored
- **Backward compatibility**: Public APIs remain unchanged
- **Incremental testing**: Test after each file refactor
- **Code review required**: Every phase must be approved before proceeding
- **Documentation同步**: Update docs immediately after refactoring

---

**Plan Version**: 1.0
**Created**: 2026-01-01
**Author**: Orchestrator Agent
**Status**: 🟡 Pending Approval
