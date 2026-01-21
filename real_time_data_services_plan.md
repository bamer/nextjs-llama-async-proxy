## Subtask Plan
feature: real-time-data-services
objective: Implement real-time data services, install necessary plugins, document the solution, and create styled Material-UI components

context_applied:
- code.md (coding standards)
- patterns.md (essential patterns)
- analysis.md (analysis guidelines)
- Project naming conventions
- File structure guidelines (src/app, src/components)
- Real-time data requirement (live data only, no mocks)
- Material-UI styling patterns
- Testing requirements (unit & integration)

tasks:
- seq: 01, filename: 01-install-plugins.md, title: Install required npm packages (@mui/material, @emotion/react, socket.io-client)
- seq: 02, filename: 02-analyze-services.md, title: Analyze existing services for real-time gaps
- seq: 03, filename: 03-design-data-flow.md, title: Design data flow and API contracts
- seq: 04, filename: 04-implement-realtime-service.ts, title: Implement core real-time service module
- seq: 05, filename: 05-integrate-data-sources.md, title: Integrate live data sources (WebSocket, external APIs)
- seq: 06, filename: 06-document-services.md, title: Document services with usage examples
- seq: 07, filename: 07-create-mui-components.md, title: Create styled Material-UI components for data display
- seq: 08, filename: 08-add-tests.md, title: Add unit and integration tests for service and components
- seq: 09, filename: 09-validate-implementation.md, title: Validate implementation via build, lint, test

dependencies:
- 03 -> 02 (design depends on analysis)
- 04 -> 03 (implementation depends on design)
- 05 -> 04 (integration depends on implementation)
- 06 -> 05 (documentation depends on integration)
- 07 -> 01 (UI components depend on installed plugins)
- 08 -> 04 (tests depend on implementation)
- 08 -> 07 (tests depend on UI components)
- 09 -> 08 (validation depends on tests)

exit_criteria:
- All subtask files created and reviewed
- Plugins successfully installed (node_modules updated)
- Real-time services operate with live data without mocks
- Documentation complete and published in README
- Material-UI components styled per design system
- All unit and integration tests pass (≥80% coverage)
- CI build succeeds without errors

Approval needed before file creation.