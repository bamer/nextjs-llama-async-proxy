# Presets Page - Quick Reference Guide

## Visual Layout

### Desktop View (2-Column Layout)

```
┌─ Presets Page ─────────────────────────────────────────┐
│                                                         │
│  ┌─ Sidebar ──────────┐  ┌─ Editor Panel ───────────┐ │
│  │ • default (active) │  │ default [Built-in]       │ │
│  │ • custom-preset    │  │                          │ │
│  │ • gaming           │  │ ★ Global Defaults        │ │
│  │                    │  │ 🔍 [search...]        ×  │ │
│  │ + New Preset       │  │                          │ │
│  │                    │  │ Context Size      [2048] │ │
│  │                    │  │                [Copy]    │ │
│  │                    │  │ Batch Size        [512]  │ │
│  │                    │  │                [Copy]    │ │
│  │                    │  │ Temperature       [0.7]  │ │
│  │                    │  │                [Copy]    │ │
│  │                    │  │                          │ │
│  │                    │  │ 📁 Groups                │ │
│  │                    │  │  ▶ gaming (1 model)      │ │
│  │                    │  │                          │ │
│  └────────────────────┘  └──────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Feature Examples

### 1. Search/Filter Example

**Type "temp" in search box:**

```
Global Defaults
🔍 [temp]                                    ×

Temperature       [0.7]  [Copy]
```

**Type "batch" in search box:**

```
Global Defaults
🔍 [batch]                                   ×

Batch Size        [512]  [Copy]
Micro Batch       [512]  [Copy]
```

**Clear search (click ×):**

```
Global Defaults
🔍 []

All parameters shown again
```

---

### 2. Copy Button Example

**Normal State:**

```
Context Size      [2048]  [Copy]
                                  ↑ Click to copy
```

**After Click (2 seconds):**

```
Context Size      [2048]  [✓]
                            ↑ Success feedback
                              (turns green)
```

**Toast Notification:**

```
✓ Copied: 2048
```

---

### 3. Expand/Collapse Animation

**Collapsed (Click to Expand):**

```
▶ 📁 gaming (1 model)
```

**Expanding (Smooth slide-down, 0.3s):**

```
▼ 📁 gaming (1 model)
  [Content sliding in...]
```

**Expanded:**

```
▼ 📁 gaming (1 model)
  📄 model-name
    [GPU Layers: 35]  [Copy]
    [Threads: 8]      [Copy]
```

---

## Color Scheme (Light Mode)

```css
/* Section Accents */
★ Defaults  → Blue (#3b82f6)
📁 Groups   → Yellow (#f59e0b)
📄 Models   → Cyan (#06b6d4)

/* Backgrounds */
White (#fff)         - Main content
Light Gray (#f9fafb) - Secondary areas
Mid Gray (#f3f4f6)   - Tertiary areas
Border (#e5e7eb)     - Separators

/* Text */
Dark Gray (#1f2937)  - Primary text
Mid Gray (#4b5563)   - Secondary text
Light Gray (#9ca3af) - Muted text
```

---

## Color Scheme (Dark Mode)

```css
/* Section Accents */
★ Defaults  → Blue (#3b82f6) - Same as light
📁 Groups   → Yellow (#f59e0b) - Same as light
📄 Models   → Cyan (#06b6d4) - Same as light

/* Backgrounds */
Dark (#2d2d2d)   - Main content
Darker (#252525) - Secondary areas
Dark Gray (#3d3d3d) - Tertiary areas
Gray (#4d4d4d)   - Borders

/* Text */
Light Gray (#e5e7eb)  - Primary text
Mid Gray (#a1a5b0)    - Secondary text
Dark Gray (#6b7280)   - Muted text
```

---

## Keyboard Navigation

| Key      | Action                    |
| -------- | ------------------------- |
| `Tab`    | Navigate between elements |
| `Enter`  | Click focused button      |
| `Escape` | (Future: Close modals)    |
| `Ctrl+C` | (Future: Copy value)      |

---

## Touch Targets (Mobile)

All interactive elements have minimum 44px height:

- ✓ Copy buttons
- ✓ Search input
- ✓ Clear button
- ✓ Preset items
- ✓ Section headers

---

## Responsive Breakpoints

| Width      | Layout         | Changes                    |
| ---------- | -------------- | -------------------------- |
| 1024px+    | 2-Column       | Sidebar + Editor           |
| 768-1024px | 1-Column Grid  | Presets in responsive grid |
| <768px     | 1-Column Stack | All vertical, full-width   |

---

## State Management

### Component State

```javascript
{
  // Basic state
  presets: [],
  selectedPreset: null,
  globalDefaults: {},
  groups: [],
  standaloneModels: [],

  // Expanded/Collapsed
  expandedDefaults: true,
  expandedGroups: {},
  expandedModels: {},

  // Editing
  editingDefaults: false,
  editingGroup: null,
  editingModel: null,
  editingData: null,

  // NEW: Search & Copy
  parameterFilter: "",        // ← Search filter
  copiedParam: null,          // ← Tracks copied parameter
}
```

---

## Event Handlers

| Event                                 | Handler                  | Action              |
| ------------------------------------- | ------------------------ | ------------------- |
| `input [data-action=search-params]`   | `handleSearchParams()`   | Update filter state |
| `click [data-action=clear-search]`    | `handleClearSearch()`    | Clear search        |
| `click [data-action=copy-value]`      | `handleCopyValue()`      | Copy to clipboard   |
| `click [data-action=toggle-defaults]` | `handleToggleDefaults()` | Expand/collapse     |
| `click [data-action=start-edit]`      | `handleStartEdit()`      | Enter edit mode     |
| `click [data-action=save-edit]`       | `handleSaveEdit()`       | Save changes        |

---

## CSS Classes Reference

### Layout

- `.presets-page` - Main container
- `.presets-container` - Two-column grid
- `.presets-list` - Sidebar
- `.presets-editor` - Main editor area

### Sections

- `.collapsible-section` - Expandable section
- `.section-header` - Section title bar
- `.section-content` - Section content (animated)

### Parameters

- `.params-list` - List of parameters
- `.param-item` - Single parameter
- `.param-label` - Parameter name
- `.param-value` - Parameter value (read-only)
- `.param-value-wrapper` - Flexbox container for value + copy button
- `.param-input` - Parameter input (edit mode)

### Search

- `.params-search-wrapper` - Search box container
- `.params-search-input` - Search input field
- `.params-search-clear` - Clear button

### Copy

- `.copy-btn` - Copy button
- `.copied` - Button in copied state (green)

---

## Animations

### Expand/Collapse

- **Property**: `animation: slideDown 0.3s ease-out`
- **Elements**: `.section-content`
- **Effect**: Opacity fade + height expansion

### Copy Feedback

- **Property**: `animation: copyPulse 0.4s ease-out`
- **Elements**: `.copy-btn.copied`
- **Effect**: Subtle scale pulse (1.0 → 1.1 → 1.0)

---

## Accessibility Checklist

- ✓ Search input has placeholder text
- ✓ Copy button has title tooltip
- ✓ All colors have sufficient contrast
- ✓ Keyboard navigation works
- ✓ Touch targets ≥44px
- ✓ Focus states visible
- ✓ Animations respect prefers-reduced-motion (future)

---

## Common Actions

### Search for a Parameter

1. Expand a section
2. Click/tap in search box
3. Type parameter name (e.g., "temp", "gpu", "batch")
4. Results filter in real-time
5. Click × to clear search

### Copy a Value

1. Find parameter with value you want
2. Click "Copy" button next to value
3. See green ✓ and notification
4. Paste elsewhere (Ctrl+V or Cmd+V)
5. Button auto-resets after 2 seconds

### Edit a Value

1. Click on parameter value
2. Enter edit mode (input appears)
3. Type new value
4. Click "Save" to persist
5. Or "Cancel" to discard

### Expand/Collapse

1. Click section header
2. Watch smooth slide animation
3. Content appears/disappears
4. Header shows current state (▶/▼)

---

## Tips & Tricks

- **Quick Copy**: Search for parameter, copy value immediately
- **Bulk Check**: Use search to quickly review all parameters of one type
- **Mobile Friendly**: Search box helps on small screens with many parameters
- **Dark Mode**: Switch in settings, presets page auto-updates
- **Animations**: Help visualize what's expanding/collapsing

---

## Troubleshooting

| Issue                 | Solution                                            |
| --------------------- | --------------------------------------------------- |
| Copy doesn't work     | Browser doesn't support Clipboard API (IE11)        |
| Search not filtering  | Try different parameter name or label               |
| Animations stuttering | Disable other animations, check browser performance |
| Values revert         | Make sure to click "Save" button                    |
| Dark mode colors off  | Clear browser cache, reload page                    |

---

## Performance Tips

- Search is instant (filters only 6 parameters)
- Copy is instant (uses async clipboard)
- Animations smooth (60 FPS CSS-based)
- No janky layouts (CSS grid/flexbox)
- Mobile optimized (responsive breakpoints)

---

Generated: 2026-01-09
Version: 1.0
Status: Production Ready ✓
