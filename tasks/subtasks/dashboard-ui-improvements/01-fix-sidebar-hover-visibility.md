# 01. Fix sidebar hover text visibility issue

meta:
  id: dashboard-ui-improvements-01
  feature: dashboard-ui-improvements
  priority: P1
  depends_on: []
  tags: [ui-fix, accessibility, sidebar]

objective:
- Fix the white-on-white text issue in sidebar hover states for both light and dark modes

deliverables:
- Updated Sidebar.tsx with corrected hover text colors
- Ensure text remains visible in all theme modes

steps:
- Identify the problematic CSS classes in Sidebar.tsx hover states
- Update hover background and text colors to ensure contrast
- Test in both light and dark modes

tests:
- Unit: Verify hover classes have sufficient contrast ratios
- Integration/e2e: Test sidebar navigation in different themes

acceptance_criteria:
- Sidebar menu items show visible text on hover in light mode
- Sidebar menu items show visible text on hover in dark mode
- Active state remains unchanged and visible

validation:
- Manually test hover states in browser dev tools
- Run `npm run build` to ensure no CSS errors

notes:
- Current issue: hover:bg-primary-100 (white) with text-foreground (white in dark mode)
- Solution: Use different colors for hover states that maintain readability</content>
<parameter name="filePath">tasks/subtasks/dashboard-ui-improvements/01-fix-sidebar-hover-visibility.md