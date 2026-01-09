# Presets Page - Enhanced Features

## Overview

Three new interactive features have been added to the Presets page to improve usability and user experience.

## 1. Section Expand/Collapse Animations

### What's New

Smooth slide-down and slide-up animations when expanding and collapsing sections (Defaults, Groups, Models).

### Implementation

- **Slide Down**: 0.3s ease-out animation when expanding (opacity fade + height expansion)
- **Slide Up**: 0.3s ease-out animation when collapsing (opacity fade + height contraction)
- Used for: Global Defaults, Groups, and Model sections

### Files Modified

- `public/css/pages/presets/presets.css` - Added `@keyframes slideDown` and `slideUp`

### Browser Support

- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard CSS animations (no JavaScript required)

## 2. Parameter Value Copy Buttons

### What's New

Quick-copy buttons next to parameter values for easy clipboard access.

### Features

- **Copy Button**: Appears next to each parameter value (in read-only mode)
- **Hover Effect**: Button turns blue on hover
- **Copied Feedback**: Changes to green checkmark (✓) for 2 seconds after copying
- **Success Notification**: Shows "Copied: [value]" message
- **Copy Animation**: Subtle pulse effect when button is clicked

### How to Use

1. Navigate to Presets page
2. Select a preset to view its parameters
3. Click the "Copy" button next to any parameter value
4. Value is copied to clipboard automatically
5. Button shows checkmark for 2 seconds, then reverts

### Implementation

- Uses `navigator.clipboard.writeText()` API
- State tracking: `copiedParam` tracks which parameter was just copied
- Auto-reset after 2 seconds for fresh UX
- Graceful error handling with fallback notification

### Files Modified

- `public/css/pages/presets/presets.css` - Added `.copy-btn` and `.copied` styles
- `public/js/pages/presets.js` - Added `handleCopyValue()` method and copy button rendering

## 3. Parameter Search/Filter

### What's New

Search box to filter parameters by name or label.

### Features

- **Real-time Search**: Filters parameters as you type
- **Search Scope**: Matches against both parameter name and label
- **Case-Insensitive**: Searches work regardless of case
- **Clear Button**: "×" button to quickly clear search
- **Visual Feedback**: Search box only appears when section is expanded

### How to Use

1. Navigate to Presets page and select a preset
2. Expand Global Defaults (or any section)
3. Use the search box at the top: "Filter parameters by name..."
4. Type to filter (e.g., type "ctx" to show only context size)
5. Click "×" to clear search and show all parameters

### Examples

- Type "temp" → shows Temperature parameter
- Type "ctx" → shows Context Size parameter
- Type "batch" → shows Batch Size and Micro Batch parameters
- Type "gpu" → shows GPU Layers parameter

### Implementation Details

#### State Management

- `parameterFilter`: Stores the current search term
- Stored in component state and passed to render methods

#### Filtering Logic

```javascript
const filteredParams = PRESET_PARAMS.filter(
  (param) => param.label.toLowerCase().includes(filter) || param.key.toLowerCase().includes(filter)
);
```

#### Performance

- Filter computation is O(n) where n = number of parameters
- Only rerenders matching parameters (efficient for large lists)
- No debouncing needed due to small parameter set

### Files Modified

- `public/css/pages/presets/presets.css` - Added `.params-search-wrapper`, `.params-search-input`, `.params-search-clear` styles
- `public/js/pages/presets.js`:
  - Added `parameterFilter` state variable
  - Added `renderParameterSearch()` method
  - Updated `renderReadOnlyParams()` to filter parameters
  - Added `handleSearchParams()` event handler
  - Added `handleClearSearch()` event handler
  - Updated event map to handle search events

## User Interface

### Search Box Appearance

```
🔍 [Filter parameters by name...] ×
```

When search is empty, the "×" button is hidden.
When search has text, the "×" button appears to quickly clear.

### Copy Button Appearance

Normal state: `[Copy]` button (gray)
Hover state: `[Copy]` button (blue)
After copy: `[✓]` button (green) for 2 seconds, then resets

## Keyboard Support

- **Search Input**: Standard text input with arrow keys and editing shortcuts
- **Copy Button**: Click to copy (no keyboard shortcut yet)
- **Clear Search**: Click to clear, or manually select all and delete

## Mobile/Responsive Design

### Search Box

- Full width on mobile
- Proper touch targets (min 44px height)
- Works well on tablets

### Copy Button

- Sized appropriately for touch (minimum 44px height)
- Inline with value for efficient layout
- Visible on all screen sizes

## Accessibility

### Search Input

- Proper `placeholder` text for guidance
- High contrast in both light and dark modes
- Keyboard accessible (Tab navigation)

### Copy Button

- `title` attribute for tooltip ("Copy value")
- Clear visual feedback (color changes)
- Works with keyboard (Enter key on focused button)

## Performance Considerations

1. **Search Filtering**: Very fast (6 parameters max)
2. **Copy to Clipboard**: Instant (uses async clipboard API)
3. **Animation FPS**: Smooth 60fps animations using CSS transforms
4. **Memory**: Minimal overhead (~2 new state variables)

## Browser Compatibility

| Feature          | Chrome | Firefox | Safari    | Edge |
| ---------------- | ------ | ------- | --------- | ---- |
| Slide Animations | ✓      | ✓       | ✓         | ✓    |
| Copy Button      | ✓      | ✓       | ✓         | ✓    |
| Clipboard API    | ✓      | ✓       | ✓ (13.1+) | ✓    |
| CSS Variables    | ✓      | ✓       | ✓         | ✓    |

## Future Enhancements

Potential improvements for future versions:

- **Keyboard Shortcuts**: Ctrl+C on selected value
- **Bulk Copy**: Export all parameters as JSON
- **Advanced Search**: Support for regex patterns
- **Search History**: Remember recent searches
- **Parameter Grouping**: Group by category in filtered view

## Testing Checklist

- [ ] Expand/collapse sections with animations
- [ ] Search filter works case-insensitively
- [ ] Copy button changes to checkmark
- [ ] Clipboard paste works after copy
- [ ] Clear button shows/hides appropriately
- [ ] Dark mode colors are readable
- [ ] Mobile layout is responsive
- [ ] No console errors
