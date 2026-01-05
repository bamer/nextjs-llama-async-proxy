# Component Library Documentation

**Version:** 1.0.0  
**Last Updated:** January 5, 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Design Tokens](#design-tokens)
4. [Components](#components)
   - [Button](#button)
   - [Card](#card)
   - [FormField](#formfield)
   - [DataTable](#datatable)
   - [Breadcrumbs](#breadcrumbs)
   - [EmptyState](#emptystate)
   - [GlobalSearch](#globalsearch)
   - [Skeleton](#skeleton)
5. [Theming](#theming)
6. [Migration Guide](#migration-guide)

---

## Introduction

This document outlines the component library for the Next.js Llama Async Proxy application. The library provides a consistent set of UI components built on top of Material-UI (MUI) v8, following the application's design system.

### Goals

- **Consistency** - Unified design language across all pages
- **Accessibility** - WCAG 2.1 AA compliant components
- **Performance** - Optimized for Next.js 16 with React 19
- **Maintainability** - Single responsibility components under 200 lines

---

## Getting Started

### Installation

All components are included with the application. Import from `@/components/ui`:

```tsx
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { FormField } from "@/components/ui";
```

### Using Components

All components are client-side components. Use `"use client"` directive:

```tsx
"use client";

import { Button } from "@/components/ui";

export default function MyComponent() {
  return (
    <Button variant="primary" onClick={() => console.log("clicked")}>
      Click Me
    </Button>
  );
}
```

---

## Design Tokens

Design tokens are defined in `src/styles/component-tokens.ts` and extend the MUI theme.

### Button Tokens

| Token | Value | Description |
|-------|-------|-------------|
| `button.primary.background` | `primary.main` | Primary button background |
| `button.primary.color` | `primary.contrastText` | Primary button text color |
| `button.primary.borderRadius` | `8px` | Primary button corner radius |
| `button.secondary.borderColor` | `divider` | Secondary button border |

### Card Tokens

| Token | Value | Description |
|-------|-------|-------------|
| `card.borderRadius` | `12px` | Card corner radius |
| `card.boxShadow` | `0 2px 8px rgba(0,0,0,0.08)` | Default shadow |
| `card.hoverBoxShadow` | `0 8px 24px rgba(0,0,0,0.12)` | Hover shadow |

### Input Tokens

| Token | Value | Description |
|-------|-------|-------------|
| `input.borderRadius` | `8px` | Input corner radius |
| `input.height` | `44px` | Input height |

---

## Components

### Button

Standardized button component with multiple variants.

```tsx
import { Button } from "@/components/ui";
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'icon'` | `'primary'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `fullWidth` | `boolean` | `false` | Full width button |
| `startIcon` | `React.ReactNode` | - | Icon before label |
| `endIcon` | `React.ReactNode` | - | Icon after label |
| `onClick` | `() => void` | - | Click handler |
| `children` | `React.ReactNode` | **required** | Button content |

#### Examples

```tsx
// Primary button
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>

// Secondary button with icon
<Button variant="secondary" startIcon={<RefreshIcon />}>
  Refresh
</Button>

// Ghost button
<Button variant="ghost" onClick={handleCancel}>
  Cancel
</Button>

// Icon button
<Button variant="icon" onClick={handleMenu}>
  <MenuIcon />
</Button>

// Loading state
<Button variant="primary" loading>
  Saving...
</Button>
```

---

### Card

Container component with consistent styling and hover effects.

```tsx
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui";
```

#### Props (Card)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'elevated' \| 'outlined' \| 'flat'` | `'elevated'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size preset |
| `hoverable` | `boolean` | `false` | Enable hover effect |
| `clickable` | `boolean` | `false` | Make card clickable |
| `onClick` | `() => void` | - | Click handler |
| `children` | `React.ReactNode` | **required** | Card content |

#### Props (CardHeader)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **required** | Header title |
| `subtitle` | `string` | - | Subtitle text |
| `action` | `React.ReactNode` | - | Action element |
| `avatar` | `React.ReactNode` | - | Avatar element |

#### Props (CardFooter)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `React.ReactNode[]` | - | Action buttons |
| `divider` | `boolean` | `false` | Show divider |

#### Examples

```tsx
// Basic card
<Card variant="elevated">
  <CardHeader title="Card Title" subtitle="Subtitle" />
  <CardContent>
    <Typography>Card content goes here</Typography>
  </CardContent>
  <CardFooter actions={<Button>Action</Button>} />
</Card>

// Hoverable clickable card
<Card variant="outlined" hoverable clickable onClick={handleClick}>
  <CardContent>Click me</CardContent>
</Card>
```

---

### FormField

Unified input component with built-in validation display and search functionality.

```tsx
import { FormField } from "@/components/ui";
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string \| number` | - | Input value |
| `onChange` | `(value: string void` | - | Change \| number) => handler |
| `fieldType` | `'text' \| 'number' \| 'email' \| 'password' \| 'search' \| 'select'` | `'text'` | Input type |
| `error` | `boolean` | - | Show error state |
| `helperText` | `string` | - | Helper/validation text |
| `disabled` | `boolean` | `false` | Disable input |
| `required` | `boolean` | `false` | Required field |
| `startAdornment` | `React.ReactNode` | - | Start icon |
| `endAdornment` | `React.ReactNode` | - | End icon |
| `size` | `'small' \| 'medium'` | `'medium'` | Input size |
| `fullWidth` | `boolean` | `true` | Full width |

#### Examples

```tsx
// Text input
<FormField
  label="Username"
  placeholder="Enter username"
  value={username}
  onChange={setUsername}
/>

// Search input with clear button
<FormField
  fieldType="search"
  placeholder="Search..."
  value={search}
  onChange={setSearch}
  startAdornment={<SearchIcon />}
/>

// Number input
<FormField
  fieldType="number"
  label="Age"
  value={age}
  onChange={setAge}
/>

// With error
<FormField
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  error={hasError}
  helperText={errorMessage}
/>
```

---

### DataTable

Data table with sorting, pagination, and selection support.

```tsx
import { DataTable, TableToolbar } from "@/components/ui";
```

#### Props (DataTable)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Column<T>[]` | **required** | Column definitions |
| `rows` | `T[]` | **required** | Row data |
| `loading` | `boolean` | `false` | Show loading state |
| `pageSize` | `number` | `10` | Rows per page |
| `totalCount` | `number` | - | Total rows (for pagination) |
| `page` | `number` | `0` | Current page |
| `onPageChange` | `(page: number, size: number) => void` | - | Page change handler |
| `onSort` | `(columnId: string, direction: 'asc' \| 'desc') => void` | - | Sort handler |
| `onSelectionChange` | `(ids: string[]) => void` | - | Selection change |
| `selectedIds` | `string[]` | `[]` | Selected row IDs |
| `emptyMessage` | `string` | `'No data available'` | Empty state message |
| `rowKey` | `keyof T \| ((row: T) => string)` | **required** | Row identifier |

#### Column Definition

```typescript
interface Column<T> {
  id: keyof T | string;
  label: string;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}
```

#### Examples

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns: Column<User>[] = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'email', label: 'Email' },
  {
    id: 'role',
    label: 'Role',
    render: (value) => <Chip label={value} size="small" />
  }
];

<DataTable<User>
  columns={columns}
  rows={users}
  rowKey="id"
  onSort={(columnId, direction) => console.log(columnId, direction)}
  onSelectionChange={(ids) => console.log(ids)}
/>
```

#### TableToolbar

```tsx
<TableToolbar
  title="Users"
  selectedCount={selectedIds.length}
  actions={
    <>
      <Button startIcon={<DeleteIcon />}>Delete</Button>
      <Button startIcon={<ExportIcon />}>Export</Button>
    </>
  }
  filters={<FiltersComponent />}
/>
```

---

### Breadcrumbs

Navigation breadcrumbs component.

```tsx
import { Breadcrumbs } from "@/components/ui";
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BreadcrumbItem[]` | **required** | Breadcrumb items |

#### BreadcrumbItem

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}
```

#### Examples

```tsx
<Breadcrumbs
  items={[
    { label: 'Home', href: '/', icon: <HomeIcon /> },
    { label: 'Models', href: '/models' },
    { label: 'llama-7b' }
  ]}
/>
```

---

### EmptyState

Component for displaying empty states with CTAs.

```tsx
import { EmptyState } from "@/components/ui";
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `illustration` | `'models' \| 'logs' \| 'search' \| 'custom'` | `'custom'` | Illustration type |
| `title` | `string` | **required** | Title text |
| `description` | `string` | - | Description text |
| `primaryAction` | `{ label: string; onClick: () => void; icon?: React.ReactNode }` | - | Primary CTA |
| `secondaryAction` | `{ label: string; onClick: () => void }` | - | Secondary CTA |
| `tips` | `string[]` | - | Help tips |
| `documentationUrl` | `string` | - | Docs link |

#### Examples

```tsx
<EmptyState
  illustration="models"
  title="No Models Found"
  description="Get started by adding your first AI model."
  primaryAction={{
    label: 'Add Model',
    onClick: handleAddModel,
    icon: <AddIcon />
  }}
  secondaryAction={{
    label: 'Scan Directory',
    onClick: handleScan
  }}
  tips={[
    'Models are stored in /media/bamer/llm/llama/models',
    'Supported formats: .gguf, .safetensors'
  ]}
/>
```

---

### GlobalSearch

Global search dialog (⌘K shortcut).

```tsx
import { GlobalSearch } from "@/components/ui";
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `models` | `SearchResult[]` | - | Model search results |
| `settings` | `SearchResult[]` | - | Settings search results |
| `logs` | `SearchResult[]` | - | Logs search results |

#### SearchResult

```typescript
interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Models' | 'Settings' | 'Logs';
}
```

#### Usage

```tsx
<GlobalSearch
  models={modelResults}
  settings={settingResults}
  logs={logResults}
/>

// Opens with ⌘K or Ctrl+K
```

---

### Skeleton

Loading placeholder components.

```tsx
import { SkeletonText, SkeletonBox, SkeletonCard } from "@/components/ui";
```

#### Examples

```tsx
// Text skeleton
<SkeletonText lines={3} />

// Box skeleton
<SkeletonBox width={200} height={100} />

// Card skeleton
<SkeletonCard />

// Custom skeleton
<SkeletonBox variant="rectangular" width="100%" height={60} animation="wave" />
```

---

## Theming

### Customizing the Theme

Modify `src/styles/theme.ts` to customize the design tokens:

```typescript
import { createTheme } from '@mui/material';
import { componentTokens } from './component-tokens';

export const theme = createTheme({
  ...componentTokens,
  palette: {
    // Custom palette
  }
});
```

### Dark Mode

All components automatically adapt to dark mode via the `ThemeContext`:

```tsx
const { isDark } = useTheme();

// Components use isDark to adjust styles
```

---

## Migration Guide

### Upgrading from Raw HTML/Mixed UI

#### Before (Raw HTML)

```tsx
<input
  type="text"
  placeholder="Search..."
  className="border border-border rounded-md px-4 py-2 bg-background"
/>

<button className="bg-primary text-primary-foreground px-4 py-2 rounded">
  Submit
</button>
```

#### After (Standardized Components)

```tsx
<FormField
  placeholder="Search..."
  value={search}
  onChange={setSearch}
/>

<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>
```

### Button Migration

| Old | New |
|-----|-----|
| `<button className="btn-primary">` | `<Button variant="primary">` |
| `<button className="btn-secondary">` | `<Button variant="secondary">` |
| `<button className="btn-ghost">` | `<Button variant="ghost">` |

### Input Migration

| Old | New |
|-----|-----|
| `<input type="text">` | `<FormField fieldType="text">` |
| `<input type="number">` | `<FormField fieldType="number">` |
| `<select>` | `<FormField fieldType="select">` |

---

## Best Practices

1. **Use composition** - Build complex UIs from small components
2. **Keep under 200 lines** - Extract sub-components when approaching limit
3. **Single responsibility** - Each component does one thing well
4. **Use TypeScript** - Always type props and return values
5. **Test components** - Write tests for new components

---

## Support

For questions or issues, please refer to:
- [Testing Guide](../docs/TESTING.md)
- [Code Review Guidelines](../docs/CODE_REVIEW.md)
- Issue tracker
