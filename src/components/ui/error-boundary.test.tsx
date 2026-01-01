/**
 * ErrorBoundary Test Orchestrator
 * 
 * This file orchestrates all ErrorBoundary test suites.
 * Individual test files are located at:
 * - error-boundary.unit.test.tsx (unit tests)
 * - error-boundary.integration.test.tsx (integration tests)
 * - error-boundary.edge-case.test.tsx (edge cases)
 * 
 * Run all tests: pnpm test error-boundary
 */

import { ErrorBoundary } from './error-boundary';

describe('ErrorBoundary - Orchestrator', () => {
  it('should be defined', () => {
    expect(ErrorBoundary).toBeDefined();
    expect(typeof ErrorBoundary).toBe('function');
  });
});

// Note: Individual test suites are imported and run by Jest automatically
// based on the .test.tsx file naming convention. This file serves as a
// reference point and provides a basic definition check.
