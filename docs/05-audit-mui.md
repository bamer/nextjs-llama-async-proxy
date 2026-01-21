# Audit Material‑UI Usage

## Overview
This document audits the current usage of Material‑UI (MUI) components throughout the codebase to identify underused or unused components, and provides recommendations for creating styled components where needed.

## Current MUI Imports
- `import { Box, Chip, Text } from '@mui/material';` (found in some files)
- `import Card from '@mui/material/Card';` etc.

## Underused Components
- `Chip` is imported but rarely used; only appears in notifications section.
- `Text` was imported incorrectly and never used.
- Some MUI components in `src/components/ui` are only basic wrappers.

## Recommendations
1. Replace generic HTML elements with styled MUI components where appropriate.
2. Create custom styled components (e.g., `RealTimeStatusBadge`) to encapsulate styling.
3. Remove unused imports to keep bundle size minimal.

## Next Steps
- Implement styled components as needed (see `06-create-styled-components.md`).
- Update component usage in `DashboardPage.tsx` and other pages.

*Prepared by: Development Agent*