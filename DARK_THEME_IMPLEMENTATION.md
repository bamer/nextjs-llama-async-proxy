# Dark Theme Implementation

## Overview
Added a full dark theme variant to the Llama Proxy Dashboard with a toggle button in the sidebar footer, just above the connection status indicator.

## Features
- ✅ Complete dark theme with carefully chosen color palette
- ✅ Toggle button in sidebar footer (🌙 Dark / ☀️ Light)
- ✅ Smooth transitions between themes
- ✅ Persistent theme preference (localStorage)
- ✅ Works across all pages and components

## Files Modified

### 1. `/public/css/main.css`
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
--card-bg: #fff
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
--card-bg: #252525
```

Updated all color references throughout the CSS to use the new variables:
- Body text and backgrounds
- Sidebar styling
- Header and buttons
- Cards and form elements
- Navigation links
- Input fields

### 2. `/public/js/components/layout/layout.js`
Updated the Sidebar component:

**Added theme toggle button** in the sidebar footer:
```javascript
Component.h(
  "button",
  { className: "theme-toggle-btn", "data-action": "toggle-theme" },
  "🌙 Dark"
)
```

**Added theme state management**:
- Tracks `darkMode` state in localStorage
- `handleThemeToggle()` - Toggles between light and dark modes
- `_applyTheme()` - Applies the `dark-mode` class to the document root
- `_updateThemeButton()` - Updates button label based on current theme
- `didMount()` - Restores theme preference on page load

**CSS for theme toggle button** (`.theme-toggle-btn`):
- Full width button in sidebar footer
- Border with transition effects
- Hover state with primary color highlight
- Positioned just above the connection status

## Dark Theme Color Palette

| Element | Light | Dark |
|---------|-------|------|
| Primary Text | #1f2937 | #e5e7eb |
| Secondary Text | #4b5563 | #9ca3af |
| Background | #f9fafb | #0f0f0f |
| Card Background | #ffffff | #252525 |
| Sidebar | #ffffff | #1a1a1a |
| Header | #ffffff | #1f1f1f |
| Border | #e5e7eb | #3f3f3f |

## How It Works

1. **Storage**: Theme preference is stored in `localStorage.darkMode` as a string ("true" or "false")
2. **Application**: When set to true, the `dark-mode` class is added to `<html>`
3. **CSS Variables**: Dark theme variables override light theme defaults
4. **Persistence**: Theme choice persists across browser sessions
5. **Restoration**: On page load, the Sidebar component checks localStorage and applies the saved theme

## Usage

Users can toggle the theme by clicking the button in the sidebar footer:
- **Light Mode**: Shows "🌙 Dark" button
- **Dark Mode**: Shows "☀️ Light" button

The preference is automatically saved and restored on next visit.

## Browser Support

Works in all modern browsers that support:
- CSS custom properties (variables)
- localStorage API
- Class manipulation on document root

## Testing

Theme toggle was tested with Playwright:
- ✅ Light theme initial load
- ✅ Toggle to dark theme
- ✅ Visual changes applied correctly
- ✅ HTML element receives `dark-mode` class
- ✅ Toggle back to light theme
- ✅ All components respond to theme changes

## Future Enhancements

Possible improvements:
- Detect system theme preference (prefers-color-scheme)
- Add theme transition animations
- Per-page theme customization
- Additional theme variants (e.g., high contrast)
