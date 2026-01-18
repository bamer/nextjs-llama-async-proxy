# UI/UX - Complete Documentation

Comprehensive documentation for all user interface improvements, styling, theme support, and layout refinements.

---

## Table of Contents

1. [Overview](#overview)
2. [Layout Fixes](#layout-fixes)
3. [Dark Theme](#dark-theme)
4. [Dashboard Refinements](#dashboard-refinements)
5. [GPU Styling](#gpu-styling)
6. [Form Elements](#form-elements)
7. [Visual Results](#visual-results)
8. [Browser Compatibility](#browser-compatibility)
9. [Component Lifecycle (January 2026)](#component-lifecycle-january-2026)
10. [Consolidated From](#consolidated-from)

---

## Overview

This document covers all UI/UX improvements made to the Llama Proxy Dashboard, including layout fixes, theme support, component styling, and visual refinements.

### Key Improvements

✅ **Header fixed** at top with proper z-index  
✅ **Sidebar positioned** directly under header (no overlap)  
✅ **Collapsed sidebar** shows emoji icons (no empty state)  
✅ **Connection status** always visible at bottom  
✅ **Clean layout** separation between header, sidebar, and content  
✅ **Dark theme** with toggle button  
✅ **GPU styling** unified with dashboard design system  
✅ **Form elements** properly styled in both themes

---

## Layout Fixes

### Issues Fixed

#### 1. Header Not Fixed (Overlapping with Content)

**Problem**: Header was relative, content scrolled over it

**Solution**: Made header `position: fixed` with `z-index: 100`

**Result**: Header now stays at top while content scrolls

---

#### 2. Sidebar Not Under Header

**Problem**: Sidebar started from `top: 0`, overlapping the header

**Solution**: Changed sidebar `top` to `64px` (header height)

**Result**: Sidebar positioned directly below header with no overlap

---

#### 3. Collapsed Sidebar Showing Empty

**Problem**: When sidebar collapsed, nav items disappeared (text was hidden)

**Solution**: Updated CSS to show emoji icons when collapsed

- Icons display at 1.5rem size
- Text hidden using `span:nth-child(2) { display: none }`
- Proper centering with flexbox
- 50px min-height for touch targets

**Result**: Collapsed sidebar shows 4 emoji navigation icons

---

#### 4. Text Overflow Issues

**Problem**: Text overflow in various places

**Solution**:
- Header title: Added `overflow: hidden`, `text-overflow: ellipsis`
- Nav links: Proper flexbox with `min-width: 0`
- Status badge: Added `white-space: nowrap`, `flex-shrink: 0`

**Result**: No text overflow anywhere

---

#### 5. Poor Integration Between Header and Sidebar

**Problem**: Header and sidebar didn't look connected

**Solution**:
- Consistent heights and spacing
- Added subtle shadows for depth
- Proper background colors
- Fixed positioning on header

**Result**: Clean, professional layout with clear visual hierarchy

---

### CSS Changes

#### Sidebar Positioning

```css
.sidebar {
  top: 64px; /* Below header */
  height: calc(100vh - 64px); /* Account for header */
}
```

#### Header Positioning

```css
.page-header {
  position: fixed;
  top: 0;
  z-index: 100;
  width: 100%; /* Full screen width */
}
```

#### Main Content

```css
.main-content {
  margin-left: var(--sidebar);
  margin-top: 64px; /* Below fixed header */
  min-height: calc(100vh - 64px);
}
```

#### Collapsed Sidebar Navigation

```css
.sidebar.collapsed .sidebar-nav .nav-link {
  font-size: 1.5rem; /* Larger emojis */
  min-height: 50px; /* Touch-friendly */
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sidebar.collapsed .nav-link span:nth-child(2) {
  display: none; /* Hide text labels */
}
```

---

### HTML Changes

Restructured navigation links for better responsive styling:

```javascript
// Before:
Component.h("a", {...}, "📊 Dashboard")

// After:
Component.h("a", {...},
  Component.h("span", {}, "📊"),
  Component.h("span", {}, "Dashboard")
)
```

---

### Sidebar Visual Enhancements

**Added transitions**: Smooth width transition (0.3s ease) when collapsing/expanding

**Subtle shadow**: Added box-shadow for depth (`1px 0 3px rgba(0, 0, 0, 0.05)`)

**Better navigation links**:
- Changed to flexbox layout for proper emoji/text alignment
- Improved spacing: `10px` padding with `4px` margins for breathing room
- Added smooth transitions on hover (0.2s ease)
- Color change on hover (text turns blue/primary color)
- Better font size (0.95rem) for readability
- Icon remains flex-shrink: 0 to prevent collapsing

---

## Dark Theme

### Overview

Added a full dark theme variant with a toggle button in the sidebar footer, just above the connection status indicator.

### Features

- ✅ Complete dark theme with carefully chosen color palette
- ✅ Toggle button in sidebar footer (🌙 Dark / ☀️ Light)
- ✅ Smooth transitions between themes
- ✅ Persistent theme preference (localStorage)
- ✅ Works across all pages and components

### Files Modified

#### `/public/css/main.css`

Added CSS variables for theming with light/dark variants:

**Light Theme Variables (root)**

```css
--text-primary: var(--gray-800)
--text-secondary: var(--gray-600)
--bg-primary: #fff
--bg-secondary: var(--gray-50)
--bg-tertiary: var(--gray-100)
--border-color: var(--gray-200)
--header-bg: #fff
--sidebar-bg: #fff
--card-bg: #fff;
```

**Dark Theme Variables (html.dark-mode)**

```css
--text-primary: #e5e7eb
--text-secondary: #9ca3af
--bg-primary: #1a1a1a
--bg-secondary: #0f0f0f
--bg-tertiary: #2d2d2d
--border-color: #3f3f3f
--header-bg: #1f1f1f
--sidebar-bg: #1a1a1a
--card-bg: #252525;
```

#### `/public/js/components/layout/layout.js`

Updated the Sidebar component:

**Added theme toggle button** in the sidebar footer:

```javascript
Component.h("button", { className: "theme-toggle-btn", "data-action": "toggle-theme" }, "🌙 Dark");
```

**Added theme state management**:
- Tracks `darkMode` state in localStorage
- `handleThemeToggle()` - Toggles between light and dark modes
- `_applyTheme()` - Applies the `dark-mode` class to the document root
- `_updateThemeButton()` - Updates button label based on current theme
- `didMount()` - Restores theme preference on page load

---

### Dark Theme Color Palette

| Element | Light | Dark |
|---------|-------|------|
| Primary Text | #1f2937 | #e5e7eb |
| Secondary Text | #4b5563 | #9ca3af |
| Background | #f9fafb | #0f0f0f |
| Card Background | #ffffff | #252525 |
| Sidebar | #ffffff | #1a1a1a |
| Header | #ffffff | #1f1f1f |
| Border | #e5e7eb | #3f3f3f |

---

### How It Works

1. **Storage**: Theme preference is stored in `localStorage.darkMode` as a string ("true" or "false")
2. **Application**: When set to true, the `dark-mode` class is added to `<html>`
3. **CSS Variables**: Dark theme variables override light theme defaults
4. **Persistence**: Theme choice persists across browser sessions
5. **Restoration**: On page load, the Sidebar component checks localStorage and applies the saved theme

---

### Dark Theme Select Element Fixes

#### Issues Fixed

1. **Select elements had black text in dark mode** - Settings page and Models page select dropdowns were unreadable
2. **Select element performance issue** - Models page select was slow

#### CSS Fixes

**`public/css/components/badges.css`**

- **Changed:** `.filters select` styling
- **Added:**
  - `color: var(--text-primary)` - Text color adjusts for dark/light mode
  - `background: var(--card-bg)` - Background adjusts for theme
  - `border: 1px solid var(--border-color)` - Border color theme-aware

**`public/css/components/cards.css`**

- **Changed:** Global `select` element styling
- **Added:** `color: var(--text-primary)` to select rule

**`public/css/components/info.css`**

- **Changed:** `.form-group select` styling
- **Added select to existing input rules:**
  - `color: var(--text-primary)` - Dark mode text visibility
  - `background: var(--bg-primary)` - Dark mode background
  - `border: 1px solid var(--border-color)` - Dark mode border

---

## Dashboard Refinements

### Issues Fixed

#### 1. Stats Cards Not Fitting on Single Row

**Problem**: Quick stat cards were wrapping to 2 rows due to padding and font sizes

**Fixes Applied**:

- Kept 6-column grid (to fit all 6 metrics + uptime)
- Reduced card padding: `var(--md)` → `12px 14px`
- Reduced icon size: `1.75rem` → `1.5rem`
- Reduced stat label font: `0.875rem` → `0.75rem`
- Reduced stat value font: `1.5rem` → `1.25rem`
- Reduced content gap: `var(--sm)` → `4px`
- Reduced letter spacing: `0.5px` → `0.3px`

**Result**: All 6 stats cards now fit perfectly on one row:
1. CPU Usage
2. Memory Usage
3. Swap Usage
4. GPU Usage
5. GPU Memory
6. Disk Usage
7. Uptime

---

#### 2. Memory Chart Y-Axis Legend Showing Wrong Units

**Problem**: Y-axis labels didn't differentiate between System Memory (%) and GPU Memory (MB)

**Fixes Applied**:

- Added Y-axis tick formatter that detects value range:
  - Values ≤ 100 → Format as "%" (System Memory)
  - Values > 100 → Format as "MB" (GPU Memory)
- Enhanced legend display with point style and padding

**Chart Labels**:

- System Memory: Y-axis shows "0%", "25%", "50%", "75%", "100%"
- GPU Memory: Y-axis shows "0MB", "2000MB", "4000MB", etc.

---

## GPU Styling

### Problem

GPU components used inconsistent variable names and styling compared to the rest of the dashboard:

- **Color variables mismatch**: `--color-border` vs `--border-color`, `--color-text` vs `--text-primary`
- **Spacing inconsistency**: Hard-coded `16px`, `12px` vs design system variables
- **GPU Details card** had a separate, bulky design that didn't integrate well with the stats-grid
- **Progress bars** used different heights and styling

---

### Solution

#### 1. Unified CSS Variables in gpu.css

Replaced all old color/spacing variables with dashboard-consistent ones:

| Old Variable | New Variable | Impact |
|--------------|--------------|--------|
| `--color-border` | `--border-color` | All borders now consistent |
| `--color-text` | `--text-primary` | Text hierarchy unified |
| `--color-text-muted` | `--text-secondary` | Secondary text unified |
| `--color-surface` | `--card-bg` or `--bg-tertiary` | Background colors aligned |
| `--color-hover` | Transparent/rgba | Hover states cohesive |
| `16px` padding | `var(--lg)` | Spacing rhythm unified |
| `12px` padding | `var(--md)` | Consistent internal spacing |
| `6px` gap | `var(--sm)` | Gutter spacing aligned |

---

#### 2. Visual Integration of GPU Stats in StatsGrid

**Added `gpu-stat` class** to differentiate GPU cards while maintaining design cohesion:

```css
.stat-card.gpu-stat {
  border-left: 4px solid var(--danger); /* Red accent matching GPU importance */
}

.stat-card.gpu-stat::before {
  background: var(--danger); /* Red top bar on hover */
}

.stat-card.gpu-stat:hover {
  border-color: var(--danger);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1); /* Red shadow */
}
```

---

#### 3. GPU Details Card Styling

**Header now matches stat-card header**:
- Same padding, typography, hover effects
- Added `::before` pseudo-element for top bar indicator
- Smooth transitions and shadows

**GPU Card items** inside expanded section:
- Match stat-card styling with border/shadow
- Red left border (danger color) for GPU context
- Consistent spacing and typography
- Progress bars match stats-grid height (6px) with warning-danger gradient

---

#### 4. Files Modified

1. **`public/css/components/gpu.css`**
   - Replaced all `--color-*` with design system variables
   - Unified spacing: hard-coded pixels → `var(--lg)`, `var(--md)`, `var(--sm)`
   - Progress bar height: 24px → 6px (matches stats-grid)
   - Added hover states with box-shadow and border effects
   - Gradient colors: success-primary → warning-danger (GPU-appropriate)

2. **`public/css/pages/dashboard/stats.css`**
   - Added `.stat-card.gpu-stat` styling
   - GPU stats now have red accent (danger color) vs blue (primary) for CPU/system
   - Visual distinction without breaking cohesion

3. **`public/js/components/dashboard/stats-grid.js`**
   - Added `gpu-stat` class to GPU stat cards
   - Maintains same rendering pattern as other stats

---

### Color Semantics

- **Blue (primary)**: CPU, System metrics, general actions
- **Red (danger)**: GPU metrics, GPU-specific indicators
- Visual hierarchy is immediately clear to users

---

### Spacing Consistency

All spacing now uses design tokens:

- `--lg` (16px): Card padding, section spacing
- `--md` (12px): Internal component spacing, gaps
- `--sm` (8px): Small gaps, grouped items
- `--xs`: Badge padding

---

## Form Elements

### Theme Toggle Button Styling

- Full width button in sidebar footer
- Border with transition effects
- Hover state with primary color highlight
- Positioned just above the connection status

### Connection Status Improvements

- **Visual polish**: Added subtle background (`var(--gray-50)`)
- **Better styling**:
  - Padding: `6px 10px` for better visibility
  - Border-radius for rounded appearance
  - Slightly larger font size (0.875rem)
- **Connection indicators**:
  - Connected state: Green with subtle glow effect
  - Disconnected state: Red indicator
- **Sidebar footer**: Centered status display when collapsed

---

### Header Status Badge

- **No text overflow**: Added `flex-shrink: 0` and `white-space: nowrap`
- **Better styling**:
  - Increased padding (2px → 4px) with 10px horizontal
  - Background color for better visibility
  - Flexbox layout for proper alignment
  - 4px gap between indicator dot and text

---

### Card Styling

- **Subtle border**: Added `1px solid var(--gray-100)` for better definition
- **Visual hierarchy**: Cards now have both shadow and border for depth

---

## Visual Results

### Expanded Sidebar

✅ Clean navigation with icons and labels  
✅ All nav items visible  
✅ Connection status at bottom  
✅ No text overflow  

### Collapsed Sidebar

✅ Emoji icons visible and centered  
✅ 4 navigation shortcuts (Dashboard, Models, Logs, Settings)  
✅ Connection status indicator at bottom  
✅ No empty or broken states  

### Header

✅ Fixed at top of page  
✅ Spans full width  
✅ Title doesn't overflow  
✅ Online/Offline badge properly positioned  
✅ Menu button has hover state  

### Overall Layout

✅ Header above everything  
✅ Sidebar below header  
✅ Content area properly positioned  
✅ Smooth transitions when toggling sidebar  
✅ Mobile responsive design  

### Dark Mode

✅ Select elements readable in dark mode  
✅ Form inputs styled consistently  
✅ Cards and containers adapt  
✅ Navigation items styled  
✅ All components respond to theme changes  

### GPU Components

✅ GPU stats in stats-grid have red accents  
✅ GPU Details card header matches stat-card styling  
✅ Individual GPU cards inside expanded section match design  
✅ All progress bars are 6px height with warning-danger gradient  
✅ Complete design system alignment with no inconsistencies  

---

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

---

## Performance Considerations

- CSS transitions are smooth and performant
- Box-shadow is minimal (affects only sidebar)
- Flexbox layout is efficient
- No JavaScript layout thrashing
- Fixed positioning is performant
- Smooth transitions (0.3s) are GPU-accelerated

---

## Future Enhancements

- Add keyboard shortcuts for navigation
- Add active nav indicator styling
- Add breadcrumb navigation in header
- Add animation for active state transitions
- Detect system theme preference (prefers-color-scheme)
- Add theme transition animations
- Per-page theme customization
- Additional theme variants (e.g., high contrast)
- Column visibility toggle
- Bulk model selection
- Advanced filtering (size range, param range)
- Model details modal
- Export to CSV/JSON
- Column width adjustment

---

## Consolidated From

This document was consolidated from the following source files:

1. `UI_FIXES_APPLIED.md` - Complete UI fixes summary (191 lines)
2. `UI_IMPROVEMENTS_SUMMARY.md` - Comprehensive UI improvements (198 lines)
3. `DARK_THEME_IMPLEMENTATION.md` - Dark theme guide (127 lines)
4. `DARK_THEME_SELECT_FIX.md` - Select element fixes (80 lines)
5. `DASHBOARD_UI_REFINEMENTS.md` - Dashboard refinements (73 lines)
6. `GPU_STYLING_UNIFICATION.md` - GPU styling guide (116 lines)

---

**Last Updated**: January 2026
**Version**: 1.1 (Added Component Lifecycle)

---

## Component Lifecycle (January 2026)

### Overview

The component system was enhanced to properly handle nested component mounting order and state synchronization when navigating between pages. This fixes issues where child components weren't receiving state updates correctly.

### Child Component Mounting Order

#### Problem

Previously, child components' `onMount()` was called BEFORE the parent was fully initialized:

```javascript
// BEFORE (race condition):
// 1. Parent.render() creates child
// 2. component-h.js calls child.onMount() IMMEDIATELY
// 3. Child sets up subscription
// 4. But parent hasn't subscribed yet!
// 5. State changes happen, child misses them
```

#### Solution: Deferred Mounting

Implemented a queue-based system where children are mounted after the parent is ready:

```javascript
// AFTER (correct order):
// 1. Parent.render() creates child
// 2. component-h.js queues child in _pendingChildMounts
// 3. Parent.onMount() is called
// 4. Parent calls this._mountChildren() FIRST
// 5. Children.onMount() runs (parent subscriptions already set up)
// 6. State changes trigger child subscriptions correctly
```

### Files Modified

| File | Change |
|------|--------|
| `component-base.js` | Added `_pendingChildMounts` array and `_mountChildren()` method |
| `component-h.js` | Modified to queue children instead of calling onMount immediately |
| `dashboard/page.js` | Calls `_mountChildren()` FIRST in `onMount()` |
| `dashboard/dashboard-controller.js` | Added `didMount()` method |

### Implementation Details

#### Component Base (`component-base.js`)

```javascript
class Component {
  constructor(props = {}) {
    this._pendingChildMounts = [];  // Queue for child onMount calls
  }

  /**
   * Mount all queued child components. Called at the end of onMount().
   * This ensures child onMount() runs AFTER parent is fully ready.
   */
  _mountChildren() {
    while (this._pendingChildMounts.length > 0) {
      const { instance, el } = this._pendingChildMounts.shift();
      if (instance && el) {
        el._component = instance;
        instance._el = el;
        instance.bindEvents();
        instance.onMount?.();  // Now parent is ready!
      }
    }
    this._pendingChildMounts = [];
  }
}
```

#### Component Factory (`component-h.js`)

```javascript
Component.h = function (tag, attrs = {}, ...children) {
  // Handle Component classes
  if (typeof tag === "function" && tag.prototype instanceof Component) {
    const instance = new tag(attrs);

    if (typeof instance.onMount === "function") {
      // Check if parent is being created (we're inside a render)
      if (this && this._pendingChildMounts !== undefined) {
        this._pendingChildMounts.push({ instance, el });
      } else {
        // No parent to queue to, call directly
        instance.onMount();
      }
    }
    // ...
  }
};
```

#### Dashboard Page (`dashboard/page.js`)

```javascript
class DashboardPage extends Component {
  onMount() {
    // Mount child components FIRST - they need to be ready before we sync state
    // This ensures LlamaRouterCard.onMount() sets up subscriptions before presets arrive
    this._mountChildren();

    // Subscribe to all state changes
    this.unsubscribers.push(
      stateManager.subscribe("presets", this._onPresetsChange.bind(this)),
      // ... other subscriptions
    );
  }
}
```

### didMount() Lifecycle Hook

Added a new `didMount()` lifecycle hook that runs AFTER the component and all children are mounted:

```javascript
class DashboardPage extends Component {
  /**
   * Called after component is fully mounted to DOM - sync state to UI
   * This runs after all child components are mounted, so routerCard is available
   */
  didMount() {
    this._syncStateToUI();
  }
}
```

**Router Integration:**

```javascript
// In router.js
_callDidMount(el) {
  if (el._component && el._component.didMount && !el._component._mounted) {
    el._component._mounted = true;
    el._component.didMount();
  }
  // Recursively call on all children
  if (el.children) {
    Array.from(el.children).forEach((c) => this._callDidMount(c));
  }
}
```

### State Sync on Page Return

Added `_syncStateToUI()` method to handle cached state when returning to a page:

```javascript
_syncStateToUI() {
  const metrics = stateManager.get("metrics");
  const presets = stateManager.get("presets");

  if (presets) {
    this.state.presets = presets;
    this._updatePresetsUI();
  }
  // ... sync other state data
}
```

**Why This Matters:**

When navigating from Dashboard → Models → Dashboard:
1. Presets are loaded and stored in `stateManager.get("presets")`
2. User navigates to Models page
3. User navigates back to Dashboard
4. Presets are already in stateManager (cached)
5. But the state subscription callback won't fire (same reference)
6. `_syncStateToUI()` in `didMount()` ensures UI updates with cached data

### Preset Selector Bug Fix

Fixed a critical bug where presets didn't load when navigating back to Dashboard:

**Root Cause:** Wrong CSS class selector
- Code used: `.llama-router-card`
- Actual class: `.llama-router-status-card`

**Fix:**
```javascript
// BEFORE (always null):
const routerCard = this.$(".llama-router-card")?._component;

// AFTER (finds the element):
const routerCard = this.$(".llama-router-status-card")?._component;
```

### Testing the Fix

1. Navigate to Dashboard - presets should appear in dropdown
2. Navigate to Models page
3. Navigate back to Dashboard
4. Presets should still appear (was broken before fix)

Check browser console for logs:
```
[LlamaRouterCard] Constructor - presets: { count: 3, ... }
[DashboardPage] _syncStateToUI - state synced from stateManager
[DashboardPage] _updatePresetsUI - directly updated routerCard: 3
```
