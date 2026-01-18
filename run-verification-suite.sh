#!/bin/bash
# Database Migration 004 - Complete Verification Suite
# This script runs all verification tests for the migration

echo "============================================================"
echo "DATABASE MIGRATION 004 - VERIFICATION SUITE"
echo "============================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
OVERALL_STATUS=0

# Test 1: Initial Database Inspection
echo -e "${YELLOW}Test 1: Pre-Migration Database Inspection${NC}"
echo "------------------------------------------------------------"
node inspect-db.js
TEST1_STATUS=$?
if [ $TEST1_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    OVERALL_STATUS=1
fi
echo ""

# Test 2: Run Migration
echo -e "${YELLOW}Test 2: Run Database Migration${NC}"
echo "------------------------------------------------------------"
node verify-migration-004.js
TEST2_STATUS=$?
if [ $TEST2_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    OVERALL_STATUS=1
fi
echo ""

# Test 3: API Endpoint Testing
echo -e "${YELLOW}Test 3: API Endpoint Testing${NC}"
echo "------------------------------------------------------------"
node test-api-endpoints.js
TEST3_STATUS=$?
if [ $TEST3_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    OVERALL_STATUS=1
fi
echo ""

# Test 4: Idempotency Test
echo -e "${YELLOW}Test 4: Migration Idempotency Test${NC}"
echo "------------------------------------------------------------"
node test-idempotency.js
TEST4_STATUS=$?
if [ $TEST4_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    OVERALL_STATUS=1
fi
echo ""

# Final Summary
echo "============================================================"
echo "VERIFICATION SUITE SUMMARY"
echo "============================================================"
echo "Test 1: Pre-Migration Inspection    - $([ $TEST1_STATUS -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Test 2: Migration Execution         - $([ $TEST2_STATUS -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Test 3: API Endpoint Testing        - $([ $TEST3_STATUS -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Test 4: Idempotency Testing         - $([ $TEST4_STATUS -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo ""

if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "Database migration 004 completed successfully."
    echo "All data has been migrated and verified."
    echo "Backup available at: data/llama-dashboard.db.backup"
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please review the test output above for details."
    echo "Restore from backup if needed: cp data/llama-dashboard.db.backup data/llama-dashboard.db"
fi

echo ""
echo "============================================================"
echo "FILES CREATED"
echo "============================================================"
echo "• verify-migration-004.js  - Main migration verification"
echo "• test-api-endpoints.js    - API endpoint testing"
echo "• test-idempotency.js      - Idempotency testing"
echo "• inspect-db.js            - Database inspection utility"
echo "• MIGRATION_004_REPORT.md  - Comprehensive migration report"
echo "============================================================"

exit $OVERALL_STATUS
