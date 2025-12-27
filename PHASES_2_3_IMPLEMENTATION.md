# Phases 2 & 3 Implementation: Business Logic & WebSocket Testing

## Task Progress

### Phase 2: Business Logic (35% of remaining coverage)
- [ ] 1. Model & Server Management
  - [ ] Test `src/lib/ollama.ts`
  - [ ] Test `src/lib/process-manager.ts`
  - [ ] Test `src/server/services/LlamaService.ts`
  - [ ] Test `src/server/services/llama/` sub-services
- [ ] 2. Monitoring & Metrics
  - [ ] Test `src/lib/monitor.ts`
  - [ ] Test `src/hooks/useSystemMetrics.ts`
  - [ ] Test `src/hooks/useChartHistory.ts`
- [ ] 3. Settings & Configuration
  - [ ] Test `src/hooks/useSettings.ts`
  - [ ] Test `src/hooks/use-logger-config.ts`

### Phase 3: WebSocket & Real-time (15% of remaining coverage)
- [ ] 1. WebSocket Infrastructure
  - [ ] Test `src/hooks/use-websocket.ts`
  - [ ] Test `src/lib/websocket-client.ts`
  - [ ] Test `src/lib/websocket-transport.ts`
- [ ] 2. Status & Discovery
  - [ ] Test `src/hooks/useLlamaStatus.ts`
  - [ ] Test `src/lib/services/ModelDiscoveryService.ts`

## Implementation Strategy

### Testing Approach
1. **Analyze each file structure** before writing tests
2. **Follow existing test patterns** from the codebase
3. **Use comprehensive mocking** for external dependencies
4. **Cover all critical paths** including error scenarios
5. **Ensure 98% coverage** for each file

### Mocking Strategy
- Mock Node.js modules (fs, child_process, etc.)
- Mock WebSocket connections
- Mock axios/fetch for API calls
- Mock React hooks dependencies
- Use jest-mock-extended for TypeScript

## Next Steps
1. Examine file structures and dependencies
2. Create test files following naming conventions
3. Implement comprehensive test suites
4. Run coverage analysis
5. Refine and optimize tests
