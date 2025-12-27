# MultiSelect Component

A reusable Material-UI multi-select dropdown with checkboxes. Allows users to select multiple options from a dropdown list with checkboxes for each item.

## Features

- **Multiple selection** - Select any combination of options
- **Visual feedback** - Selected items shown as color-coded chips
- **Select All / Deselect All** - Quick action to select/deselect all options
- **Smart display** - Shows selected items or count when too many selected
- **Customizable** - Support for custom labels, colors, and styling
- **Type-safe** - Full TypeScript support with generic types
- **Accessible** - Proper keyboard navigation and screen reader support

## Installation

Import from the components library:

```tsx
import { MultiSelect, MultiSelectOption } from '@/components/ui';
```

## Basic Usage

```tsx
import { MultiSelect } from '@/components/ui';
import { useState } from 'react';

function MyComponent() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const options: MultiSelectOption[] = [
    { value: 'error', label: 'Error', color: '#f44336' },
    { value: 'warn', label: 'Warning', color: '#ff9800' },
    { value: 'info', label: 'Info', color: '#2196f3' },
    { value: 'debug', label: 'Debug', color: '#4caf50' },
  ];

  return (
    <MultiSelect
      label="Log Levels"
      options={options}
      selected={selected}
      onChange={setSelected}
    />
  );
}
```

## Props

### `label?: string`
Optional label displayed above the select input.

```tsx
<MultiSelect
  label="Filter Options"
  options={options}
  selected={selected}
  onChange={setSelected}
/>
```

### `options: MultiSelectOption<T>[]`
Array of options to display in the dropdown.

```tsx
interface MultiSelectOption<T = string> {
  value: T;           // The value of the option
  label: string;       // The display label
  color?: string;       // Optional color for the option (used in chips and labels)
}
```

### `selected: Set<T>`
Set of currently selected values.

### `onChange: (selected: Set<T>) => void`
Callback function called when selection changes.

```tsx
<MultiSelect
  options={options}
  selected={selected}
  onChange={(newSelected) => setSelected(newSelected)}
/>
```

### `placeholder?: string`
Placeholder text shown when nothing is selected. Default: `"Select..."`

### `disabled?: boolean`
Disable the select input. Default: `false`

### `showSelectAll?: boolean`
Show "Select All / Deselect All" option in dropdown. Default: `true`

### `maxSelectedDisplay?: number`
Maximum number of selected items to display as chips. If more selected, shows count. Default: `3`

### `displayAllWhenFull?: boolean`
Show all selected items as chips even when exceeding `maxSelectedDisplay`. Default: `false`

### `size?: 'small' | 'medium'`
Size of the select input. Default: `'small'`

### `fullWidth?: boolean`
Whether the select should take full width of its container. Default: `true`

### `sx?: SxProps`
Custom styles to apply to the component container.

## Advanced Examples

### Custom Display Behavior

```tsx
// Show up to 5 selected items as chips, then count
<MultiSelect
  options={options}
  selected={selected}
  onChange={setSelected}
  maxSelectedDisplay={5}
  displayAllWhenFull={false}
/>

// Always show all selected items (no count)
<MultiSelect
  options={options}
  selected={selected}
  onChange={setSelected}
  displayAllWhenFull={true}
/>
```

### Without Select All Option

```tsx
<MultiSelect
  options={options}
  selected={selected}
  onChange={setSelected}
  showSelectAll={false}
/>
```

### Custom Styling

```tsx
<MultiSelect
  options={options}
  selected={selected}
  onChange={setSelected}
  sx={{
    minWidth: 300,
    marginTop: 2,
  }}
/>
```

### Numeric Values

```tsx
const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set([1, 3]));

const numericOptions: MultiSelectOption<number>[] = [
  { value: 1, label: 'One', color: '#f44336' },
  { value: 2, label: 'Two', color: '#ff9800' },
  { value: 3, label: 'Three', color: '#2196f3' },
  { value: 4, label: 'Four', color: '#4caf50' },
];

<MultiSelect<number>
  options={numericOptions}
  selected={selectedNumbers}
  onChange={setSelectedNumbers}
/>
```

## Usage in Logs Page

```tsx
import { MultiSelect, MultiSelectOption } from '@/components/ui';
import { useStore } from '@/lib/store';

function LogsPage() {
  const logs = useStore((state) => state.logs);
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(
    new Set(['error', 'warn', 'info', 'debug'])
  );

  const logLevelOptions: MultiSelectOption[] = [
    { value: 'error', label: 'Error', color: '#f44336' },
    { value: 'warn', label: 'Warning', color: '#ff9800' },
    { value: 'info', label: 'Info', color: '#2196f3' },
    { value: 'debug', label: 'Debug', color: '#4caf50' },
  ];

  const filteredLogs = logs.filter(log =>
    selectedLevels.has(log.level)
  );

  return (
    <MultiSelect
      label="Log Levels"
      options={logLevelOptions}
      selected={selectedLevels}
      onChange={setSelectedLevels}
      placeholder="Filter by log levels..."
      showSelectAll={true}
      maxSelectedDisplay={3}
      size="small"
      fullWidth={false}
    />
  );
}
```

## Behavior

### Selection Display
- **0 selected**: Shows placeholder text
- **1-3 selected** (default): Shows individual color-coded chips
- **4+ selected**: Shows count (e.g., "4 selected")

### Select All
- When **some** selected: Shows "Select All" with indeterminate checkbox
- When **all** selected: Shows "Deselect All" with checked checkbox
- When **none** selected: Shows "Select All" with unchecked checkbox

### Color Coding
- Selected items displayed as color-coded chips
- Dropdown items colored when selected
- Checkbox colors match option colors when set

## Accessibility

- Full keyboard navigation support
- Screen reader friendly labels
- Proper ARIA attributes from MUI Select
- Clear visual feedback for selection state

## Performance

- Uses `Set` for O(1) lookup operations
- Memoized callbacks with `useCallback`
- Minimal re-renders with proper React patterns

## Browser Support

All modern browsers supporting:
- ES6+ (Set, arrow functions)
- Material-UI v5
- React 18+

## License

MIT
