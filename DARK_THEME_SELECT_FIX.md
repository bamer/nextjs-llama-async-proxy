# Dark Theme Select Element Fixes

## Issues Fixed

1. **Select elements had black text in dark mode** - Settings page and Models page select dropdowns were unreadable
2. **Select element performance issue** - Models page select was slow and couldn't change values (same as logs page issue)

## Changes Made

### CSS Fixes (Dark Mode Text Visibility)

#### 1. `public/css/components/badges.css`
- **Changed:** `.filters select` styling
- **Added:** 
  - `color: var(--text-primary)` - Text color adjusts for dark/light mode
  - `background: var(--card-bg)` - Background adjusts for theme
  - `border: 1px solid var(--border-color)` - Border color theme-aware
  - `padding` and `border-radius` - Proper styling

#### 2. `public/css/components/cards.css`
- **Changed:** Global `select` element styling
- **Added:** `color: var(--text-primary)` to select rule

#### 3. `public/css/components/info.css`
- **Changed:** `.form-group select` styling
- **Added select to existing input rules:**
  - `color: var(--text-primary)` - Dark mode text visibility
  - `background: var(--bg-primary)` - Dark mode background
  - `border: 1px solid var(--border-color)` - Dark mode border
- **Updated focus state:** `.form-group select:focus` now has proper styling

### JavaScript Fix (Select Performance)

#### `public/js/pages/models.js`
- **Added:** `shouldUpdate(newProps)` method to ModelsPage class
- **Purpose:** Prevent unnecessary re-renders when only filter state changes
- **How it works:** Only re-renders if the actual models list changes (by count or content), not when filter selections change
- **Result:** Select dropdown won't lose focus or reset value when user changes filter

## Why These Fixes Work

### Dark Mode CSS Variables
The application uses CSS variables that automatically switch between light and dark modes:
- `var(--text-primary)` → #e5e7eb (dark mode) or #1f2937 (light mode)
- `var(--bg-primary)` → #2d2d2d (dark mode) or #fff (light mode)
- `var(--card-bg)` → #353535 (dark mode) or #fff (light mode)
- `var(--border-color)` → #4d4d4d (dark mode) or #e5e7eb (light mode)

By using these variables instead of hardcoded colors, selects automatically become readable in both themes.

### Performance Optimization (shouldUpdate)
The `shouldUpdate` method is a lifecycle hook that:
1. Checks if the props (models list) actually changed
2. Only returns `true` if models list changed (triggering re-render)
3. Returns `false` if only filter state changed (skipping re-render)
4. This prevents the DOM from being recreated when users interact with filters

## Testing

- Verified select elements are now visible and readable in dark mode
- Select value changes work smoothly without performance issues
- Light mode compatibility maintained (using CSS variables)

## Files Modified

```
public/css/components/badges.css
public/css/components/cards.css
public/css/components/info.css
public/js/pages/models.js
```
