# Presets Page Theme Update

## Overview

The Presets page has been updated to match the rest of the application's dark and light mode theme. The styling is now fully consistent with the dashboard, models, and settings pages.

## Changes Made

### 1. New CSS File

**File**: `public/css/pages/presets/presets.css` (new)

Complete styling for the presets page with:

- Proper color scheme using CSS variables
- Dark and light mode support
- Consistent spacing and typography
- Responsive design for mobile and tablet
- Smooth transitions and hover effects
- Color-coded sections (blue for defaults, yellow for groups, cyan for models)

### 2. Updated CSS Variables

**File**: `public/css/variables.css`

Added missing variables that are used throughout the app:

- `--text-muted`: Muted text color for secondary information
- `--bg-hover`: Background color for hover states
- `--color-primary-rgb`: RGB values for primary color (used in shadow/rgba effects)
- `--transition-fast`: Standard transition timing for UI interactions

These variables are now defined for both light and dark modes.

### 3. CSS Structure

The presets.css file provides styling for all major components:

```
.presets-page              - Main container
├── .presets-header        - Page title and description
├── .presets-container     - Two-column layout
│   ├── .presets-list      - Sidebar with preset items
│   └── .presets-editor    - Main editing area
│       ├── .editor-header
│       ├── .collapsible-section (defaults, groups)
│       │   ├── .section-header
│       │   └── .section-content
│       └── .model-section
│           ├── .model-header
│           └── .params-list
│               ├── .param-item
│               ├── .param-label
│               ├── .param-value
│               └── .param-input
├── .param-actions         - Save/Cancel buttons
└── .btn                   - Various button styles
```

## Features

### Color Coding by Section Type

- **Defaults** (★): Blue accent - `--primary`
- **Groups** (📁): Yellow accent - `--warning`
- **Models** (📄): Cyan accent - `--info`

### Responsive Design

- **Desktop (1024px+)**: Two-column layout
  - Left sidebar: Preset list (sticky)
  - Right panel: Editor with scrolling
- **Tablet (768px - 1023px)**: Single column, grid preset list
  - Presets in responsive grid
  - Editor below

- **Mobile (<768px)**: Full width single column
  - Stack all elements vertically
  - Full-width buttons and inputs

### Dark Mode Support

All colors automatically adjust when dark mode is enabled via the `html.dark-mode` class:

- Text contrast optimized for readability
- Background colors use darker shades
- Borders and separators have appropriate visibility
- Accent colors remain distinct but are adjusted for dark backgrounds

## CSS Variables Used

### Colors

- `--primary` / `--primary-hover`: Blue accent
- `--success`, `--warning`, `--danger`, `--info`: Status colors
- `--text-primary`, `--text-secondary`, `--text-muted`: Text colors
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`: Background colors
- `--bg-hover`: Hover state background
- `--border-color`: Border and separator colors

### Spacing

- `--xs` (0.25rem): Smallest spacing
- `--sm` (0.5rem): Small gaps
- `--md` (1rem): Medium gaps
- `--lg` (1.5rem): Large gaps
- `--xl` (2rem): Extra large gaps

### Effects

- `--radius`: Border radius
- `--shadow`: Box shadow
- `--transition-fast`: Quick transitions (150ms)

## Testing

To verify the theming:

1. **Light Mode**:
   - Navigate to Presets page
   - Verify white backgrounds and dark text
   - Check section headers have appropriate colors
   - Test hover effects on preset items

2. **Dark Mode**:
   - Toggle theme to dark mode
   - Verify dark backgrounds (#2d2d2d, #252525, etc.)
   - Check text is readable
   - Verify section accents are visible
   - Test input fields are accessible

3. **Responsive**:
   - Resize browser to tablet width (768px)
   - Verify preset list converts to grid
   - Shrink to mobile (<480px)
   - Verify all elements stack properly

## Browser Compatibility

The styling uses only standard CSS features:

- CSS Variables (supported in all modern browsers)
- CSS Grid and Flexbox
- Transitions and animations
- No custom vendor prefixes required

## Consistency

The presets page now matches the styling patterns of:

- Dashboard page: Same color scheme, spacing, transitions
- Models page: Similar card and list styling
- Settings page: Consistent form and section styling
- Overall app: Uses the same CSS variable system for theming

## Future Improvements

Potential enhancements:

- Add animations when collapsing/expanding sections
- Add keyboard shortcuts for editing
- Add copy/paste for parameter values
- Add parameter search/filter in edit mode
