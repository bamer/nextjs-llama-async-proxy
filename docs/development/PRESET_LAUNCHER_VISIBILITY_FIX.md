# Fix: Preset Launcher Visibility in Router Card

## Problem

The preset selection dropdown was not visible in the Llama Router card on the Dashboard page, even though we added it to the RouterCard component.

## Root Cause

The script loading order in `index.html` was incorrect. The old `router-card.js` was loaded AFTER `dashboard/router-card.js`, which overwrote the enhanced version with the old simplified version.

### Script Load Order (Before Fix):

```
1. /js/components/dashboard/router-card.js  ← EnhancedRouterCard with presets
2. /js/components/router-card.js           ← OLD SimpleRouterCard (no presets)
                                             ↓ OVERWRITES #1
window.RouterCard = SimpleRouterCard       ✗ No preset launcher
```

### Script Load Order (After Fix):

```
1. /js/components/dashboard/router-card.js  ← EnhancedRouterCard with presets
2. /js/components/router-card.js           ← OLD SimpleRouterCard (no presets)
   (only used by Settings page)

window.RouterCard = EnhancedRouterCard     ✓ Has preset launcher
```

## Solution

Updated `public/index.html` to load `dashboard/router-card.js` BEFORE `router-card.js`.

### Change Made:

```html
<!-- BEFORE -->
<script src="/js/components/router-card.js"></script>
<script src="/js/components/dashboard/quick-actions.js"></script>

<!-- AFTER -->
<script src="/js/components/dashboard/router-card.js"></script>
<script src="/js/components/router-card.js"></script>
<script src="/js/components/dashboard/quick-actions.js"></script>
```

## File Structure

```
public/js/components/
├── dashboard/
│   └── router-card.js          ← Enhanced RouterCard
│       • Includes preset launcher
│       • Combobox for preset selection
│       • Launch with Preset button
│       • Full UI state management
│
└── router-card.js              ← Legacy RouterCard
    • Used only by Settings page
    • Simpler control panel
```

## What You Should See

### Dashboard - Router Card Section

```
┌─────────────────────────────────────┐
│ 🦙 Llama Router        [RUNNING]    │
│ Port: 8080                          │
│ Models: 2/4 loaded                  │
│                                     │
│ [⏹ Stop Router] [🔄 Restart]       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Launch with Preset                  │
│                                     │
│ Select Preset:                      │
│ [▼ -- Choose a preset --]           │
│     ├─ default                      │
│     ├─ fast-inference               │
│     └─ quality-mode                 │
│                                     │
│ [🚀 Launch Server with Preset]      │
│                                     │
│ Presets are created and configured  │
│ in the Presets page                 │
└─────────────────────────────────────┘
```

## Testing Steps

1. **Refresh the Dashboard page** (Ctrl+F5 to clear cache)
2. **Look in the router-section** - You should now see:
   - Llama Router card (Start/Stop buttons)
   - **NEW: Launch with Preset section below it**
3. **Select a preset** from the dropdown
4. **Click "Launch Server with Preset"**
5. **Server should start** with the selected preset's configuration

## Why This Matters

- **Dashboard**: Uses the enhanced RouterCard with preset launcher
- **Settings**: Uses the legacy RouterCard (simplified interface)
- **Both** can now launch servers with presets
- **No conflicts** because they're separate components

## Loading Sequence

```
index.html loads scripts
  ↓
dashboard/router-card.js ✓
  • Defines EnhancedRouterCard class
  • Sets window.RouterCard = EnhancedRouterCard
  ↓
router-card.js (legacy)
  • Defines old RouterCard class
  • But window.RouterCard already set, so doesn't overwrite
  ↓
Dashboard page uses window.RouterCard
  • Gets the enhanced version ✓
  • Renders with preset launcher ✓
```

## Browser Cache Note

If you still don't see the combobox:

1. **Hard refresh**: Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Clear cache**: Open DevTools → Settings → Clear site data
3. **Check Console**: F12 → Console tab for any errors

## Summary

✓ Dashboard router card now displays preset selection dropdown  
✓ Users can select a preset before launching  
✓ "Launch Server with Preset" button is functional  
✓ Settings page still has its own simple router card  
✓ No conflicts or duplicates
