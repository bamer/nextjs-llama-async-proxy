#!/usr/bin/env bash

# =============================================================================
# PHASE 6: Final Validation Script
# Lint Fix Plan - Phase 6 of 6
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Output files
LINT_OUTPUT="/tmp/final-lint-$(date +%s).txt"
TEST_OUTPUT="/tmp/final-test-$(date +%s).txt"
TYPECHECK_OUTPUT="/tmp/final-typecheck-$(date +%s).txt"
FINAL_REPORT="/tmp/final-validation-report-$(date +%s).md"

# ==============================================================================
# FUNCTIONS
# ==============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${GREEN}>>> $1${NC}"
    echo ""
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# ==============================================================================
# VALIDATION PHASES
# ==============================================================================

print_header "PHASE 6: FINAL VALIDATION"
echo "Timestamp: $TIMESTAMP"
echo "Project: nextjs-llama-async-proxy"
echo ""

# ------------------------------------------------------------------------------
# 1. Lint Analysis
# ------------------------------------------------------------------------------
print_section "1. Running Lint Analysis..."
echo "Executing: pnpm lint"
echo ""

if pnpm lint 2>&1 | tee "$LINT_OUTPUT"; then
    LINT_STATUS="PASS"
    print_success "Lint completed"
else
    LINT_STATUS="FAIL"
    print_warning "Lint found issues"
fi

echo ""
echo "--- Lint Output saved to: $LINT_OUTPUT"

# Count errors by category
echo ""
echo "Lint Error Breakdown:"
echo "====================="

# Count @typescript-eslint/no-explicit-any
ANY_ERRORS=$(grep -c "@typescript-eslint/no-explicit-any" "$LINT_OUTPUT" || echo "0")
echo "• @typescript-eslint/no-explicit-any: $ANY_ERRORS"

# Count @typescript-eslint/no-require-imports
REQUIRE_ERRORS=$(grep -c "@typescript-eslint/no-require-imports" "$LINT_OUTPUT" || echo "0")
echo "• @typescript-eslint/no-require-imports: $REQUIRE_ERRORS"

# Count @typescript-eslint/no-unused-vars
UNUSED_VARS_ERRORS=$(grep -c "@typescript-eslint/no-unused-vars" "$LINT_OUTPUT" || echo "0")
echo "• @typescript-eslint/no-unused-vars: $UNUSED_VARS_ERRORS"

# Count react/display-name
DISPLAY_NAME_ERRORS=$(grep -c "react/display-name" "$LINT_OUTPUT" || echo "0")
echo "• react/display-name: $DISPLAY_NAME_ERRORS"

# Count jsx-a11y warnings
A11Y_WARNINGS=$(grep -c "jsx-a11y" "$LINT_OUTPUT" || echo "0")
echo "• jsx-a11y issues: $A11Y_WARNINGS"

# Count other errors
OTHER_ERRORS=$(grep -c "error" "$LINT_OUTPUT" || echo "0")
echo "• Other errors: $OTHER_ERRORS"

# Count total errors
TOTAL_ERRORS=$(grep -c "error" "$LINT_OUTPUT" || echo "0")
echo ""
echo "Total Lint Errors: $TOTAL_ERRORS"

# Count total warnings
TOTAL_WARNINGS=$(grep -c "warning" "$LINT_OUTPUT" || echo "0")
echo "Total Lint Warnings: $TOTAL_WARNINGS"

# List files with errors
echo ""
echo "Files with Lint Errors:"
echo "======================="
grep "^/" "$LINT_OUTPUT" | awk '{print $1}' | sort -u || echo "No files with errors"

# ------------------------------------------------------------------------------
# 2. Test Execution
# ------------------------------------------------------------------------------
print_section "2. Running Test Suite..."
echo "Executing: pnpm test"
echo ""

if pnpm test 2>&1 | tee "$TEST_OUTPUT"; then
    TEST_STATUS="PASS"
    print_success "All tests passed"
else
    TEST_STATUS="FAIL"
    print_error "Some tests failed"
fi

echo ""
echo "--- Test output saved to: $TEST_OUTPUT"

# Extract test summary from Jest output
echo ""
echo "Test Summary:"
echo "============="
TEST_SUMMARY=$(tail -30 "$TEST_OUTPUT" | grep -E "(Test Suites|Tests)" || echo "Summary not available")
echo "$TEST_SUMMARY"

# Count passed/failed tests
TESTS_PASSED=$(grep -oP "(?<=Tests:       )\d+ passed" "$TEST_OUTPUT" || echo "N/A")
TESTS_FAILED=$(grep -oP "(?<=Tests:       )\d+ failed" "$TEST_OUTPUT" || echo "N/A")
TEST_SUITE_PASSED=$(grep -oP "(?<=Test Suites: )\d+ passed" "$TEST_OUTPUT" || echo "N/A")
TEST_SUITE_FAILED=$(grep -oP "(?<=Test Suites: )\d+ failed" "$TEST_OUTPUT" || echo "N/A")

if [ "$TESTS_PASSED" != "N/A" ]; then
    echo ""
    echo "Detailed Results:"
    echo "• Test Suites Passed: $TEST_SUITE_PASSED"
    echo "• Test Suites Failed: $TEST_SUITE_FAILED"
    echo "• Tests Passed: $TESTS_PASSED"
    echo "• Tests Failed: $TESTS_FAILED"
fi

# List failed tests
if [ "$TEST_STATUS" = "FAIL" ]; then
    echo ""
    echo "Failed Test Files:"
    echo "=================="
    grep "FAIL" "$TEST_OUTPUT" || echo "No failed tests found"
fi

# ------------------------------------------------------------------------------
# 3. Type Checking
# ------------------------------------------------------------------------------
print_section "3. Running TypeScript Type Check..."
echo "Executing: pnpm type:check"
echo ""

if pnpm type:check 2>&1 | tee "$TYPECHECK_OUTPUT"; then
    TYPECHECK_STATUS="PASS"
    print_success "TypeScript compilation successful"
else
    TYPECHECK_STATUS="FAIL"
    print_error "TypeScript compilation failed"
fi

echo ""
echo "--- Typecheck output saved to: $TYPECHECK_OUTPUT"

# Count TypeScript errors
TS_ERRORS=$(grep -c "error TS" "$TYPECHECK_OUTPUT" || echo "0")
echo "TypeScript Errors: $TS_ERRORS"

# List files with TS errors
if [ "$TS_ERRORS" -gt 0 ]; then
    echo ""
    echo "Files with TypeScript Errors:"
    echo "============================="
    grep "^/" "$TYPECHECK_OUTPUT" | awk '{print $1}' | sort -u || echo "No files with errors"
fi

# ------------------------------------------------------------------------------
# 4. Code Quality Analysis
# ------------------------------------------------------------------------------
print_section "4. Code Quality Analysis"

# Count files in project
echo "Project Statistics:"
echo "==================="
TS_FILES=$(find . -name "*.ts" -not -path "./node_modules/*" -not -path "./.next/*" | wc -l)
TSX_FILES=$(find . -name "*.tsx" -not -path "./node_modules/*" -not -path "./.next/*" | wc -l)
TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.tsx" | wc -l)

echo "• TypeScript files (.ts): $TS_FILES"
echo "• TypeScript React files (.tsx): $TSX_FILES"
echo "• Test files: $TEST_FILES"

# Count 'any' type usage
echo ""
echo "Type Safety Metrics:"
echo "==================="
ANY_COUNT=$(grep -r ": any" src/ app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l)
ANY_COUNT_TESTS=$(grep -r ": any" __tests__/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l)

echo "• 'any' type usage in src/app: $ANY_COUNT"
echo "• 'any' type usage in __tests__: $ANY_COUNT_TESTS"

# Count 'require' imports
REQUIRE_COUNT=$(grep -r "require(" src/ app/ __tests__/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "// require" | wc -l)
echo "• 'require()' imports: $REQUIRE_COUNT"

# ------------------------------------------------------------------------------
# 5. Generate Final Report
# ------------------------------------------------------------------------------
print_section "5. Generating Final Report..."

cat > "$FINAL_REPORT" <<EOF
# Final Validation Report - Phase 6

**Generated:** $TIMESTAMP
**Project:** nextjs-llama-async-proxy

---

## Executive Summary

| Metric | Status | Details |
|--------|--------|---------|
| **Lint Status** | $LINT_STATUS | $TOTAL_ERRORS errors, $TOTAL_WARNINGS warnings |
| **Test Status** | $TEST_STATUS | $TESTS_PASSED passed, $TESTS_FAILED failed |
| **TypeScript** | $TYPECHECK_STATUS | $TS_ERRORS TS errors |

---

## 1. Lint Analysis Results

### Error Breakdown

| Error Type | Count |
|-------------|-------|
| @typescript-eslint/no-explicit-any | $ANY_ERRORS |
| @typescript-eslint/no-require-imports | $REQUIRE_ERRORS |
| @typescript-eslint/no-unused-vars | $UNUSED_VARS_ERRORS |
| react/display-name | $DISPLAY_NAME_ERRORS |
| jsx-a11y issues | $A11Y_WARNINGS |
| Other errors | $OTHER_ERRORS |

**Total Errors:** $TOTAL_ERRORS
**Total Warnings:** $TOTAL_WARNINGS

### Files with Lint Errors

\`\`\`
$(grep "^/" "$LINT_OUTPUT" | awk '{print $1}' | sort -u | head -20 || echo "No files with errors")
\`\`\`

---

## 2. Test Results

### Test Suite Summary

| Metric | Count |
|--------|-------|
| Test Suites Passed | $TEST_SUITE_PASSED |
| Test Suites Failed | $TEST_SUITE_FAILED |
| Tests Passed | $TESTS_PASSED |
| Tests Failed | $TESTS_FAILED |

### Test Status

\`\`\`
$TEST_STATUS
\`\`\`

### Failed Tests (if any)

\`\`\`
$(grep "FAIL" "$TEST_OUTPUT" | head -10 || echo "No failed tests")
\`\`\`

---

## 3. TypeScript Validation

### Compilation Status

\`\`\`
$TYPECHECK_STATUS
\`\`\`

### TypeScript Errors

**Total TS Errors:** $TS_ERRORS

### Files with TS Errors (if any)

\`\`\`
$(grep "^/" "$TYPECHECK_OUTPUT" | awk '{print $1}' | sort -u || echo "No files with errors")
\`\`\`

---

## 4. Code Quality Metrics

### Project Statistics

| Metric | Count |
|--------|-------|
| TypeScript files (.ts) | $TS_FILES |
| TypeScript React files (.tsx) | $TSX_FILES |
| Test files | $TEST_FILES |

### Type Safety

| Metric | Count |
|--------|-------|
| 'any' type usage in src/app | $ANY_COUNT |
| 'any' type usage in __tests__ | $ANY_COUNT_TESTS |
| 'require()' imports | $REQUIRE_COUNT |

---

## 5. Recommendations

EOF

# Add recommendations based on results
if [ "$LINT_STATUS" = "PASS" ] && [ "$TEST_STATUS" = "PASS" ] && [ "$TYPECHECK_STATUS" = "PASS" ]; then
    cat >> "$FINAL_REPORT" <<EOF
### ✅ ALL VALIDATIONS PASSED

**Excellent!** The project is in excellent condition:

1. **Lint Clean:** No lint errors or warnings
2. **Tests Passing:** All test suites passing
3. **Type Safety:** TypeScript compilation successful
4. **Code Quality:** High standards maintained

**Recommended Actions:**
- ✅ Commit all changes with message: "Phase 6: Final validation complete - clean project"
- ✅ Proceed with deployment or next development phase
- ✅ Consider enabling CI/CD lint gates

**Next Steps:**
- Run `pnpm build` to verify production build
- Review any remaining 'any' types in test files (consider creating mock types)
- Monitor for any regressions in future development

EOF
else
    cat >> "$FINAL_REPORT" <<EOF
### ⚠️ ACTION REQUIRED

Some validations failed. Please review the sections below:

EOF

    if [ "$LINT_STATUS" = "FAIL" ]; then
        cat >> "$FINAL_REPORT" <<EOF
#### Lint Issues Found

**Recommendations:**

1. **@typescript-eslint/no-explicit-any ($ANY_ERRORS errors):**
   - Replace `any` with proper types or type assertions
   - Create mock interfaces for test files
   - Use \`as Type\` syntax for type assertions

2. **@typescript-eslint/no-require-imports ($REQUIRE_ERRORS errors):**
   - Convert \`require()\` to ES6 \`import\` statements
   - Example: \`import { render } from '@testing-library/react'\`

3. **@typescript-eslint/no-unused-vars ($UNUSED_VARS_ERRORS errors):**
   - Remove unused variables
   - Prefix with underscore if intentionally unused: \`_container\`

**Fix Commands:**
\`\`\`bash
# Auto-fix some issues
pnpm lint:fix

# Manual fixes required for:
- Type replacements (any → proper types)
- require() → import conversions
\`\`\`

EOF
    fi

    if [ "$TEST_STATUS" = "FAIL" ]; then
        cat >> "$FINAL_REPORT" <<EOF
#### Test Failures Found

**Recommendations:**

1. Run individual failing tests for details:
   \`\`\`bash
   pnpm test <test-file>
   \`\`\`

2. Check console output for error details in test failures

3. Verify recent changes didn't break functionality

EOF
    fi

    if [ "$TYPECHECK_STATUS" = "FAIL" ]; then
        cat >> "$FINAL_REPORT" <<EOF
#### TypeScript Errors Found

**Recommendations:**

1. Review TypeScript errors in $TYPECHECK_OUTPUT
2. Fix type mismatches and missing type definitions
3. Ensure all imports are properly typed

EOF
    fi
fi

cat >> "$FINAL_REPORT" <<EOF

---

## 6. Output Files

All validation outputs saved to:

- **Lint Output:** \`$LINT_OUTPUT\`
- **Test Output:** \`$TEST_OUTPUT\`
- **TypeCheck Output:** \`$TYPECHECK_OUTPUT\`
- **Final Report:** \`$FINAL_REPORT\`

To view the full report:
\`\`\`bash
cat $FINAL_REPORT
\`\`\`

---

## 7. Quick Reference Commands

\`\`\`bash
# Re-run lint
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm type:check

# Run tests with coverage
pnpm test:coverage
\`\`\`

---

**Report Generated by:** Phase 6 Validation Script
**Next Step:** Review recommendations and implement fixes if needed
EOF

print_success "Final report generated: $FINAL_REPORT"

# ------------------------------------------------------------------------------
# 6. Display Summary
# ------------------------------------------------------------------------------
print_header "VALIDATION SUMMARY"

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│                     FINAL VALIDATION RESULTS                 │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│  Lint Status:      $(printf '%-45s' "$LINT_STATUS")│"
echo "│  Test Status:      $(printf '%-45s' "$TEST_STATUS")│"
echo "│  TypeScript:       $(printf '%-45s' "$TYPECHECK_STATUS")│"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│  Lint Errors:      $(printf '%45s' "$TOTAL_ERRORS")│"
echo "│  Lint Warnings:    $(printf '%45s' "$TOTAL_WARNINGS")│"
echo "│  Test Passed:      $(printf '%45s' "$TESTS_PASSED")│"
echo "│  Test Failed:      $(printf '%45s' "$TESTS_FAILED")│"
echo "│  TS Errors:        $(printf '%45s' "$TS_ERRORS")│"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

if [ "$LINT_STATUS" = "PASS" ] && [ "$TEST_STATUS" = "PASS" ] && [ "$TYPECHECK_STATUS" = "PASS" ]; then
    print_success "🎉 ALL VALIDATIONS PASSED! 🎉"
    echo ""
    echo "The project is clean and ready for production."
    echo ""
    echo "Next steps:"
    echo "  1. Run: pnpm build (verify production build)"
    echo "  2. Commit changes"
    echo "  3. Deploy to production"
    echo ""
else
    print_warning "⚠️ SOME VALIDATIONS FAILED"
    echo ""
    echo "Please review the full report for details:"
    echo "  cat $FINAL_REPORT"
    echo ""
    echo "Recommendations:"
    echo "  1. Review lint errors"
    echo "  2. Fix failing tests"
    echo "  3. Resolve TypeScript errors"
    echo "  4. Re-run validation script"
    echo ""
fi

print_header "VALIDATION COMPLETE"
echo "Full report available at: $FINAL_REPORT"
echo ""

exit 0
