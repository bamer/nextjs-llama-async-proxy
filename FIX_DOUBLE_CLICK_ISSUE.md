# Fix: Settings Page Double-Click Issue

## Problem
When saving settings on the Settings page, users had to click the save button **twice** before the first save would work. After a refresh, the same issue would occur again.

## Root Cause
The issue was in the **Component base class** (`public/js/core/component.js`). When a component called `setState()`, it would:

1. Call `update()` which re-renders the component
2. Call `bindEvents()` to re-attach event listeners

However, the old implementation had a flaw in event listener cleanup:
- Event listeners were being added to the **document** level using delegation
- When a component re-rendered, the cleanup logic wasn't always being called properly
- This caused **duplicate event listeners** to accumulate

When you clicked the save button:
- **First click**: Triggered one of the old event listeners that hadn't been properly cleaned up
- **Second click**: Finally triggered the newly bound event listener
- Each re-render added more listeners without cleaning up old ones

## Solution
The fix involves two changes to `public/js/core/component.js`:

### 1. Extract Event Cleanup into a Separate Method
Created a new `_cleanupEvents()` method that handles all event listener removal:

```javascript
_cleanupEvents() {
  if (!this._delegatedHandlers) return;
  
  Object.entries(this._delegatedHandlers).forEach(([key, handler]) => {
    const [event] = key.split("|");
    document.removeEventListener(event, handler, false);
  });
}
```

### 2. Always Call Cleanup Before Rebinding
In the `bindEvents()` method, always clean up old listeners first:

```javascript
bindEvents() {
  if (!this._el) return;

  const map = this.getEventMap();
  if (Object.keys(map).length === 0) return;

  // Always clean up old listeners first
  this._cleanupEvents();
  this._delegatedHandlers = {};

  // ... rest of event binding logic
}
```

### 3. Simplify Key Generation
Removed the component class name from the delegation key to avoid stale keys:

```javascript
// Before:
const delegationKey = `${event}|${selector || "none"}|${this.constructor.name}`;

// After:
const delegationKey = `${event}|${selector || "none"}`;
```

### 4. Update Cleanup in destroy()
The `destroy()` method now uses the centralized cleanup method:

```javascript
destroy() {
  this.willDestroy && this.willDestroy();
  
  // Remove delegated event listeners from document
  this._cleanupEvents();
  this._delegatedHandlers = null;
  
  // ... rest of cleanup
}
```

## What Changed
- **File**: `public/js/core/component.js`
- **Lines changed**: 92-159
- **New method**: `_cleanupEvents()` (lines 135-142)
- **Modified methods**: `bindEvents()` and `destroy()`

## Testing
The fix ensures that:
1. ✓ Event listeners are properly cleaned up on every re-render
2. ✓ Save button (and any other buttons) respond correctly on the first click
3. ✓ Multiple clicks work without needing to refresh the page
4. ✓ No event listener accumulation over time

## Impact
This fix affects all components in the application that:
- Use `setState()` (which triggers re-renders)
- Have event handlers defined in `getEventMap()`

Specifically fixed for:
- **Settings Page** - Save button now works on first click
- **Models Page** - Action buttons (start/stop) work consistently
- **All other pages** - Any component that re-renders with events

## Files Modified
- `public/js/core/component.js` - Core Component class event handling
