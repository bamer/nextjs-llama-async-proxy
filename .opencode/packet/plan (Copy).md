# Implementation Plan: Real Data and Real-Time Services with Material UI

## Overview
This plan addresses the implementation of real data integration, real-time services, and Material UI components for the Next.js dashboard. Based on codebase analysis, the services (users, notifications, analytics) are already implemented with real-time SSE streaming. The focus shifts to Material UI modernization, auth completion, and cleanup.

## 1. Identify Incomplete Services Requiring Real Data Integration
**Status**: Partially Complete
- ✅ **Users Service** (`/api/users`): Implemented with real system process data via SSE
- ✅ **Notifications Service** (`/api/notifications`): Real-time alerts from logs/metrics via SSE
- ✅ **Analytics Service** (`/api/analytics`): Live system metrics and error rates via SSE
- ❌ **Auth Service**: Empty implementation (`src/lib/auth.ts`), marked as "À implémenter" in API docs

**Action Required**: Complete JWT authentication implementation

## 2. Plan Material UI Component Implementation for Modern Responsive UI
**Current State**: Dashboard uses Tailwind CSS with some MUI components
- MUI installed but underutilized
- DashboardPage.tsx uses custom Tailwind styling
- Recharts for visualization (good, keep this)
- Existing MUI components: Card, Button, RealTimeStatusBadge, EnhancedMetricCard

**Implementation Plan**:
- Replace Tailwind card layouts with MUI Grid, Card, Paper components
- Implement MUI DataGrid for tabular data (users, notifications)
- Use MUI Alert for notifications
- Create MUI-based MetricCard replacing current Tailwind version
- Implement responsive breakpoints using MUI theme
- Add MUI Chip, Badge, and Avatar components where appropriate

## 3. Define Real-Time Graph/Effect Features
**Current State**: Basic Recharts LineCharts for metrics
**Enhancements Needed**:
- Add interactive tooltips and legends
- Implement real-time data animation effects
- Add multiple chart types (Area, Bar for different metrics)
- Create live updating progress indicators
- Add sparkline charts in metric cards
- Implement chart zoom/pan for detailed views

## 4. Documentation Updates
**Files to Update/Create**:
- Update `docs/01-identify-services.md`: Reflect current real-time implementation status
- Update `docs/05-audit-mui.md`: Document completed MUI implementation
- Create `docs/06-auth-implementation.md`: Document JWT auth setup
- Update `API.md`: Add auth endpoints and update service descriptions
- Update `README.md`: Add Material UI usage and auth features

## 5. Remove Obsolete Files
**Files to Remove**:
- `docs/02-implement-realtime-fetching.md`: Services already implemented
- `docs/03-install-plugins.md`: MUI already installed
- `real_time_data_services_plan.md`: Implementation complete
- `subtask_plan.md`: Tasks completed
- Empty auth.ts (replace with implementation)

## Implementation Tasks (Atomic)

### Backend Tasks
1. **[backend]** Implement JWT authentication in `src/lib/auth.ts`
2. **[backend]** Create auth API routes (`/api/auth/login`, `/api/auth/logout`)
3. **[backend]** Update middleware.ts with auth checks
4. **[backend]** Add request/response tracking to monitoring service

### Frontend Tasks
5. **[frontend]** Create MUI-based MetricCard component
6. **[frontend]** Implement MUI DataGrid for users table
7. **[frontend]** Convert DashboardPage.tsx to use MUI Grid/Card layout
8. **[frontend]** Add MUI Alert components for notifications
9. **[frontend]** Enhance Charts.tsx with MUI theme integration

### Documentation Tasks
10. **[docs]** Update service documentation files
11. **[docs]** Remove obsolete planning documents
12. **[docs]** Add auth API documentation

## Security Considerations
- Implement proper JWT token validation
- Add input sanitization for auth endpoints
- Ensure SSE streams don't expose sensitive data
- Add rate limiting for auth attempts

## Testing Strategy
- Unit tests for auth utilities
- Integration tests for auth API routes
- Component tests for new MUI components
- E2E tests for dashboard real-time features

## Files to Modify
- `src/lib/auth.ts` (implement)
- `src/middleware.ts` (add auth)
- `src/app/api/auth/route.ts` (create)
- `src/components/ui/MetricCard.tsx` (create MUI version)
- `src/components/ui/DataTable.tsx` (create)
- `src/components/pages/DashboardPage.tsx` (convert to MUI)
- `src/components/ui/Charts.tsx` (enhance)
- `docs/01-identify-services.md` (update)
- `docs/05-audit-mui.md` (update)
- `API.md` (update)
- `README.md` (update)

## Dependencies
- Auth implementation must precede UI updates
- MUI components can be developed in parallel
- Documentation updates after implementation</content>
<parameter name="filePath">.opencode/packet/plan.md