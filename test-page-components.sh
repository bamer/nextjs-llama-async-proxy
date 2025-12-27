#!/bin/bash

# Test script for page components

echo "=================================="
echo "Running Page Component Tests"
echo "=================================="
echo ""

# Test ConfigurationPage
echo "Testing ConfigurationPage..."
pnpm test __tests__/components/pages/ConfigurationPage.test.tsx --passWithNoTests
CONFIG_RESULT=$?
echo ""

# Test LoggingSettings
echo "Testing LoggingSettings..."
pnpm test __tests__/components/pages/LoggingSettings.test.tsx --passWithNoTests
LOGGING_RESULT=$?
echo ""

# Test LogsPage
echo "Testing LogsPage..."
pnpm test __tests__/components/pages/LogsPage.test.tsx --passWithNoTests
LOGS_RESULT=$?
echo ""

# Test ModelsPage
echo "Testing ModelsPage..."
pnpm test __tests__/components/pages/ModelsPage.test.tsx --passWithNoTests
MODELS_RESULT=$?
echo ""

# Test MonitoringPage
echo "Testing MonitoringPage..."
pnpm test __tests__/components/pages/MonitoringPage.test.tsx --passWithNoTests
MONITORING_RESULT=$?
echo ""

# Test ApiRoutes
echo "Testing ApiRoutes..."
pnpm test __tests__/components/pages/ApiRoutes.test.tsx --passWithNoTests
API_RESULT=$?
echo ""

echo "=================================="
echo "Test Results Summary"
echo "=================================="
echo "ConfigurationPage: $([ $CONFIG_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "LoggingSettings:   $([ $LOGGING_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "LogsPage:          $([ $LOGS_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "ModelsPage:        $([ $MODELS_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "MonitoringPage:    $([ $MONITORING_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "ApiRoutes:         $([ $API_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo ""

# Overall result
if [ $CONFIG_RESULT -eq 0 ] && [ $LOGGING_RESULT -eq 0 ] && [ $LOGS_RESULT -eq 0 ] && [ $MODELS_RESULT -eq 0 ] && [ $MONITORING_RESULT -eq 0 ] && [ $API_RESULT -eq 0 ]; then
  echo "All tests passed! ✅"
  exit 0
else
  echo "Some tests failed! ❌"
  exit 1
fi
