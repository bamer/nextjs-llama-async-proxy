# Detailed UI Improvement Implementation Plan

**Document Version:** 1.0  
**Created:** January 5, 2026  
**Status:** Pending Approval  
**Total Tasks:** 55 tasks across 9 proposals  
**Estimated Duration:** 6-8 weeks  

---

## 📋 Executive Summary

This document outlines a comprehensive implementation plan to transform the user interface from its current state to a modern, user-friendly dashboard. The plan covers 55 tasks organized into 9 proposals, prioritized by impact and dependencies.

### Quick Stats
| Metric | Current | Target |
|--------|---------|--------|
| Tasks | 55 | - |
| High Priority | 38 | - |
| Medium Priority | 17 | - |
| Estimated Weeks | - | 6-8 |

---

## 🎯 Implementation Phases

```
PHASE 1 (Week 1-2)    PHASE 2 (Week 2-3)    PHASE 3 (Week 4-5)    PHASE 4 (Week 5-6)
Foundation & Design   Core Components       Advanced Features     Polish & Optimize
─────────────────     ──────────────────    ──────────────────    ──────────────────
• Design System       • Toast System        • Models Page V2       • Virtual Scrolling
• Navigation V2       • Quick Actions       • Logs Page V2         • Progressive Loading
• Unified Components  • Empty States        • Monitoring V2        • Smart Prefetching
                      • Empty States        • Bulk Actions         • Global Search
```

---

## 📦 PHASE 1: Foundation & Design System

### Phase Goal: Establish the design system foundation that all other components will use.

---

### PROPOSAL 1: Unified Design System

**Objective:** Create consistent UI components and remove mixed styling patterns.

---

#### Task 1.1: Create Design Tokens and Style Constants
**ID:** P1-T1 | **Priority:** High | **Est. Hours:** 4

**Description:**
Extend the existing design tokens to include comprehensive component-level tokens for colors, spacing, shadows, typography, and interactive states.

**Files to Create/Modify:**
- `src/styles/component-tokens.ts` (new)
- `src/styles/theme.ts` (modify)
- `src/styles/theme-colors.ts` (modify)

**Deliverables:**
```typescript
// src/styles/component-tokens.ts
export const componentTokens = {
  button: {
    primary: {
      background: 'primary.main',
      color: 'primary.contrastText',
      hoverBackground: 'primary.dark',
      activeBackground: 'primary.light',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: 600,
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    },
    secondary: {
      background: 'transparent',
      color: 'text.primary',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: 500,
    },
    ghost: {
      background: 'transparent',
      color: 'text.secondary',
      borderRadius: '8px',
      padding: '8px 16px',
      fontWeight: 500,
    },
    icon: {
      borderRadius: '50%',
      padding: '10px',
      minWidth: '40px',
      minHeight: '40px',
    },
  },
  card: {
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    hoverBoxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    background: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
  },
  input: {
    borderRadius: '8px',
    borderColor: 'divider',
    focusBorderColor: 'primary.main',
    height: '44px',
    fontSize: '0.95rem',
  },
  table: {
    borderRadius: '12px',
    headerBackground: 'action.hover',
    rowHoverBackground: 'action.selected',
  },
};

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
export type CardSize = 'small' | 'medium' | 'large';
```

**Acceptance Criteria:**
- [ ] All tokens documented with TypeScript types
- [ ] Dark/Light mode variations defined
- [ ] Tokens exported from barrel file
- [ ] Code reviewed and approved

---

#### Task 1.2: Create Standardized Button Component
**ID:** P1-T2 | **Priority:** High | **Est. Hours:** 6

**Description:**
Create a unified Button component with all variants (primary, secondary, ghost, icon) that replaces all inconsistent button usages.

**Files to Create/Modify:**
- `src/components/ui/Button/Button.tsx` (new)
- `src/components/ui/Button/Button.types.ts` (new)
- `src/components/ui/Button/index.ts` (new)
- Update all pages using raw buttons

**Component API:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
}

// Usage examples:
<Button variant="primary" onClick={handleStart}>Start Server</Button>
<Button variant="secondary" onClick={handleRefresh}>
  <RefreshIcon /> Refresh
</Button>
<Button variant="ghost" onClick={handleCancel}>Cancel</Button>
<Button variant="icon" onClick={handleMenu}>
  <MenuIcon />
</Button>
```

**Files to Update:**
- `src/components/dashboard/DashboardHeader.tsx` (replace MUI Button)
- `src/components/pages/models/ModelsControls.tsx` (replace raw buttons)
- `src/components/pages/LogsPage.tsx` (replace raw buttons)
- `src/app/page/components/HeroSection.tsx` (replace MUI Button)

---

#### Task 1.3: Create Standardized Card Component
**ID:** P1-T3 | **Priority:** High | **Est. Hours:** 6

**Description:**
Create a unified Card component with consistent shadow, hover effects, and border-radius.

**Files to Create:**
- `src/components/ui/Card/Card.tsx`
- `src/components/ui/Card/Card.types.ts`
- `src/components/ui/Card/CardHeader.tsx`
- `src/components/ui/Card/CardContent.tsx`
- `src/components/ui/Card/CardFooter.tsx`
- `src/components/ui/Card/index.ts`

**Component API:**
```typescript
interface CardProps {
  variant?: 'elevated' | 'outlined' | 'flat';
  size?: 'small' | 'medium' | 'large';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  avatar?: React.ReactNode;
}

interface CardFooterProps {
  actions?: React.ReactNode[];
  divider?: boolean;
}
```

**Style Specifications:**
```typescript
const cardStyles = {
  elevated: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: 'none',
  },
  outlined: {
    boxShadow: 'none',
    border: '1px solid',
    borderColor: 'divider',
  },
  flat: {
    boxShadow: 'none',
    border: 'none',
    background: 'action.hover',
  },
};
```

---

#### Task 1.4: Create Standardized Input/FormField Component
**ID:** P1-T4 | **Priority:** High | **Est. Hours:** 5

**Description:**
Create unified FormField component that wraps MUI TextField with app-specific styling and validation display.

**Files to Create:**
- `src/components/ui/FormField/FormField.tsx`
- `src/components/ui/FormField/FormField.types.ts`
- `src/components/ui/FormField/index.ts`

**Component API:**
```typescript
interface FormFieldProps {
  label?: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number' | 'email' | 'password' | 'search' | 'select';
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  debounce?: number;
}
```

---

#### Task 1.5: Create Standardized Table Component
**ID:** P1-T5 | **Priority:** High | **Est. Hours:** 8

**Description:**
Create a unified Table component with built-in sorting, filtering, and pagination using MUI DataGrid.

**Files to Create:**
- `src/components/ui/Table/DataTable.tsx`
- `src/components/ui/Table/DataTable.types.ts`
- `src/components/ui/Table/TableToolbar.tsx`
- `src/components/ui/Table/index.ts`

**Component API:**
```typescript
interface Column<T> {
  id: keyof T | string;
  label: string;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  pageSize?: number;
  totalCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  selectedIds?: (string | number)[];
  emptyMessage?: string;
}

interface TableToolbarProps {
  title?: string;
  selectedCount?: number;
  actions?: React.ReactNode[];
  filters?: React.ReactNode;
  search?: React.ReactNode;
}
```

---

#### Task 1.6: Replace Raw HTML Inputs in LogsPage
**ID:** P1-T6 | **Priority:** High | **Est. Hours:** 4

**Description:**
Replace all raw HTML `<input>` and `<select>` elements in LogsPage with standardized FormField components.

**Files to Modify:**
- `src/components/pages/LogsPage.tsx`

**Changes Required:**
```typescript
// BEFORE (raw HTML):
<input
  type="text"
  placeholder="Filter logs..."
  value={filterText}
  onChange={(e) => setFilterText(e.target.value)}
  className="border border-border rounded-md px-4 py-2 bg-background text-foreground"
/>

// AFTER (standardized):
<FormField
  type="search"
  placeholder="Filter logs..."
  value={filterText}
  onChange={setFilterText}
  startAdornment={<SearchIcon />}
  size="medium"
/>
```

---

#### Task 1.7: Replace Mixed UI in ModelsPage
**ID:** P1-T7 | **Priority:** High | **Est. Hours:** 4

**Description:**
Replace all mixed UI patterns (raw HTML + Tailwind classes) in ModelsPage with standardized components.

**Files to Modify:**
- `src/components/pages/ModelsPage.tsx`
- `src/app/models/components/ModelsFilters.tsx`
- `src/app/models/components/ModelsControls.tsx`

**Changes Required:**
- Replace raw button elements with Button component
- Replace raw select elements with FormField (select variant)
- Replace div containers with Card components
- Standardize spacing and layout

---

#### Task 1.8: Create Component Library Documentation
**ID:** P1-T8 | **Priority:** Medium | **Est. Hours:** 4

**Description:**
Create documentation for the component library including usage examples, props tables, and do/don't examples.

**Files to Create:**
- `docs/COMPONENT_LIBRARY.md`
- `src/components/ui/README.md`
- Story files for component playground (optional)

**Documentation Structure:**
```
docs/COMPONENT_LIBRARY.md
├── Introduction
│   └── Purpose and benefits of using the design system
├── Getting Started
│   └── Installation and basic usage
├── Components
│   ├── Button
│   │   ├── Usage Examples
│   │   ├── Props Table
│   │   └── Do's and Don'ts
│   ├── Card
│   ├── FormField
│   └── Table
├── Theming
│   └── How to customize tokens
└── Migration Guide
    └── How to upgrade from mixed UI
```

---

### PROPOSAL 1 Summary
| Task | Description | Est. Hours | Dependencies |
|------|-------------|------------|--------------|
| P1-T1 | Design Tokens | 4 | None |
| P1-T2 | Button Component | 6 | P1-T1 |
| P1-T3 | Card Component | 6 | P1-T1 |
| P1-T4 | FormField Component | 5 | P1-T1 |
| P1-T5 | Table Component | 8 | P1-T1 |
| P1-T6 | Replace LogsPage Inputs | 4 | P1-T4 |
| P1-T7 | Replace ModelsPage UI | 4 | P1-T2, P1-T3, P1-T4 |
| P1-T8 | Component Documentation | 4 | All P1 tasks |
| **TOTAL** | | **41 hours** | |

---

## 📦 PHASE 2: Core Components

### Phase Goal: Implement high-impact components that immediately improve UX.

---

### PROPOSAL 7: Toast Notification System

**Objective:** Provide immediate feedback for all user actions.

---

#### Task 7.1: Install Toast Notification Library
**ID:** P7-T1 | **Priority:** High | **Est. Hours:** 2

**Description:**
Install Sonner (or compatible alternative) for toast notifications.

**Commands:**
```bash
pnpm add sonner
pnpm add -D @types/sonner
```

**Files to Modify:**
- `src/providers/AppProvider.tsx` (add ToastProvider)
- `package.json` (update dependencies)

**Configuration:**
```typescript
// ToastProvider configuration
<Toaster
  position="top-right"
  theme={isDark ? 'dark' : 'light'}
  toastOptions={{
    duration: 5000,
    style: {
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#1e293b',
      borderRadius: '12px',
      padding: '16px',
    },
  }}
/>
```

---

#### Task 7.2: Create ToastProvider Wrapper
**ID:** P7-T2 | **Priority:** High | **Est. Hours:** 4

**Description:**
Create a wrapper around the toast library with app-specific defaults and helper functions.

**Files to Create:**
- `src/hooks/use-toast.ts` (new)
- `src/utils/toast-helpers.ts` (new)

**Hook API:**
```typescript
interface ToastOptions {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'progress';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function useToast() {
  const toast = useSonner();

  const show = (options: ToastOptions) => {
    // Implementation
  };

  const success = (title: string, message?: string) => {
    toast.success(title, { description: message });
  };

  const error = (title: string, message?: string) => {
    toast.error(title, { description: message });
  };

  const warning = (title: string, message?: string) => {
    toast.warning(title, { description: message });
  };

  const info = (title: string, message?: string) => {
    toast.info(title, { description: message });
  };

  const progress = (title: string, message?: string) => {
    toast.loading(title, { description: message });
  };

  const dismiss = (id?: string) => {
    toast.dismiss(id);
  };

  return { show, success, error, warning, info, progress, dismiss };
}
```

---

#### Task 7.3: Add Toast Notifications to Async Actions
**ID:** P7-T3 | **Priority:** High | **Est. Hours:** 8

**Description:**
Add toast notifications to all async actions across the application.

**Files to Modify:**
- `src/app/models/page.tsx` (start/stop model actions)
- `src/components/pages/ModelsPage.tsx` (model actions)
- `src/app/models/hooks/use-model-actions.ts`
- `src/components/pages/configuration/ConfigurationActions.tsx`
- `src/app/settings/page.tsx`

**Implementation Example:**
```typescript
const handleStartModel = async (modelId: string) => {
  const toastId = toast.progress(`Starting model...`);

  try {
    await startModelAPI(modelId);
    toast.dismiss(toastId);
    toast.success('Model Started', {
      message: 'The model is now running and ready to use.',
      action: { label: 'View', onClick: () => navigate('/models') }
    });
  } catch (error) {
    toast.dismiss(toastId);
    toast.error('Failed to Start Model', {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      action: { label: 'Retry', onClick: () => handleStartModel(modelId) }
    });
  }
};
```

---

#### Task 7.4: Create Notification Types
**ID:** P7-T4 | **Priority:** High | **Est. Hours:** 4

**Description:**
Define and implement all notification types with consistent styling.

**Files to Modify:**
- `src/styles/theme.ts` (add toast-specific styles)
- `src/utils/toast-helpers.ts`

**Notification Types:**
```typescript
const NOTIFICATION_TYPES = {
  success: {
    icon: <CheckCircleIcon />,
    color: '#10b981',
    backgroundColor: isDark ? '#064e3b' : '#d1fae5',
  },
  error: {
    icon: <ErrorIcon />,
    color: '#ef4444',
    backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
  },
  warning: {
    icon: <WarningIcon />,
    color: '#f59e0b',
    backgroundColor: isDark ? '#78350f' : '#fef3c7',
  },
  info: {
    icon: <InfoIcon />,
    color: '#3b82f6',
    backgroundColor: isDark ? '#1e3a8a' : '#dbeafe',
  },
  progress: {
    icon: <LoaderIcon />,
    color: '#6b7280',
    backgroundColor: isDark ? '#374151' : '#f3f4f6',
    duration: Infinity,
  },
};
```

---

#### Task 7.5: Add Inline Alerts for Form Validation
**ID:** P7-T5 | **Priority:** Medium | **Est. Hours:** 4

**Description:**
Add inline alerts/snackbars for form validation errors using the toast system.

**Files to Create/Modify:**
- `src/components/ui/InlineAlert/InlineAlert.tsx`
- `src/components/ui/InlineAlert/index.ts`
- `src/components/forms/*` (update form components)

**Component API:**
```typescript
interface InlineAlertProps {
  severity?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  onDismiss?: () => void;
  action?: React.ReactNode;
  dismissible?: boolean;
}
```

---

### PROPOSAL 7 Summary
| Task | Description | Est. Hours | Dependencies |
|------|-------------|------------|--------------|
| P7-T1 | Install Toast Library | 2 | None |
| P7-T2 | Create ToastProvider | 4 | P7-T1 |
| P7-T3 | Add Toasts to Actions | 8 | P7-T2 |
| P7-T4 | Notification Types | 4 | P7-T2 |
| P7-T5 | Inline Alerts | 4 | P7-T2 |
| **TOTAL** | | **22 hours** | |

---

### PROPOSAL 3: Enhanced Navigation

**Objective:** Improve navigation with persistent sidebar, breadcrumbs, and keyboard shortcuts.

---

#### Task 3.1: Convert Sidebar to Persistent
**ID:** P3-T1 | **Priority:** High | **Est. Hours:** 6

**Description:**
Convert sidebar from 'temporary' (drawer-style) to 'permanent' docked variant on desktop.

**Files to Modify:**
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/SidebarProvider.tsx`

**Implementation:**
```typescript
// MainLayout.tsx
<Box sx={{ display: 'flex' }}>
  <CssBaseline />
  <Header />
  <Sidebar
    variant="permanent"
    sx={{
      display: { xs: 'none', md: 'block' },
      '& .MuiDrawer-paper': {
        position: 'relative',
        width: 280,
        transform: 'none',
        transition: 'none',
      },
    }}
  />
  <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
    {children}
  </Box>
</Box>

// Sidebar.tsx - Add responsive handling
const drawerWidth = 280;
const collapsedDrawerWidth = 72;
```

**Mobile Behavior:**
- Use a drawer (temporary) for mobile
- Add hamburger menu in header
- Swipeable drawer on mobile

---

#### Task 3.2: Add Collapsible Navigation Sections
**ID:** P3-T2 | **Priority:** High | **Est. Hours:** 8

**Description:**
Add collapsible navigation sections (Overview, Management, System) with icons.

**Files to Modify:**
- `src/components/layout/Sidebar.tsx`

**Implementation:**
```typescript
interface NavSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function NavSection({ title, children, defaultExpanded = true }: NavSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Box sx={{ mb: 2 }}>
      <ListSubheader
        onClick={() => setExpanded(!expanded)}
        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <ExpandMoreIcon
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
        {title}
      </ListSubheader>
      <Collapse in={expanded}>
        <List>{children}</List>
      </Collapse>
    </Box>
  );
}

// Usage:
<NavSection title="Overview" defaultExpanded>
  <NavItem icon={Home} label="Dashboard" href="/dashboard" />
  <NavItem icon={Activity} label="Monitoring" href="/monitoring" badge="new" />
</NavSection>

<NavSection title="Management">
  <NavItem icon={Bot} label="Models" href="/models" badge={modelCount} />
  <NavItem icon={FileText} label="Logs" href="/logs" />
</NavSection>

<NavSection title="System">
  <NavItem icon={Settings} label="Settings" href="/settings" />
</NavSection>
```

---

#### Task 3.3: Add Breadcrumb Navigation
**ID:** P3-T3 | **Priority:** High | **Est. Hours:** 4

**Description:**
Add breadcrumb navigation component to MainLayout.

**Files to Create/Modify:**
- `src/components/ui/Breadcrumbs/Breadcrumbs.tsx`
- `src/components/ui/Breadcrumbs/index.ts`
- `src/components/layout/MainLayout.tsx`

**Implementation:**
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
}

function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Auto-generate from pathname or accept explicit items
  const breadcrumbs = useMemo(() => {
    // Implementation
  }, [pathname]);

  return (
    <MuiBreadcrumbs separator={<ChevronRightIcon />}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <HomeIcon fontSize="small" />
        Home
      </Link>
      {breadcrumbs.map((item, index) => (
        item.href ? (
          <Link key={index} href={item.href}>{item.label}</Link>
        ) : (
          <Typography key={index} color="text.primary">{item.label}</Typography>
        )
      ))}
    </MuiBreadcrumbs>
  );
}
```

---

#### Task 3.4: Add Keyboard Navigation Shortcuts
**ID:** P3-T4 | **Priority:** Medium | **Est. Hours:** 4

**Description:**
Add keyboard shortcuts for navigation (1-5 for main sections).

**Files to Create/Modify:**
- `src/hooks/use-keyboard-nav.ts`
- `src/app/layout.tsx`

**Implementation:**
```typescript
function useKeyboardNavigation() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + Number for navigation
      if (event.altKey) {
        switch (event.key) {
          case '1':
            router.push('/dashboard');
            break;
          case '2':
            router.push('/monitoring');
            break;
          case '3':
            router.push('/models');
            break;
          case '4':
            router.push('/logs');
            break;
          case '5':
            router.push('/settings');
            break;
        }
      }

      // Ctrl/Cmd + / to focus search
      if (event.key === '/' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
```

---

#### Task 3.5: Add Notification Badges to Sidebar
**ID:** P3-T5 | **Priority:** Medium | **Est. Hours:** 4

**Description:**
Add notification badges to sidebar menu items for alerts and updates.

**Files to Modify:**
- `src/components/layout/Sidebar.tsx`

**Implementation:**
```typescript
interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string | number;
  badgeColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success';
}

function NavItem({ icon: Icon, label, href, badge, badgeColor = 'error' }: NavItemProps) {
  return (
    <ListItemButton component={Link} href={href}>
      <ListItemIcon>
        <Icon className="h-5 w-5" />
      </ListItemIcon>
      <ListItemText primary={label} />
      {badge && (
        <Chip
          label={badge}
          size="small"
          color={badgeColor}
          sx={{ height: 20, fontSize: '0.75rem' }}
        />
      )}
    </ListItemButton>
  );
}
```

---

#### Task 3.6: Add Sidebar Collapse Toggle
**ID:** P3-T6 | **Priority:** Medium | **Est. Hours:** 6

**Description:**
Add collapsed/sidebar toggle mode for more screen space.

**Files to Create/Modify:**
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/SidebarProvider.tsx`
- `src/styles/theme.ts`

**Implementation:**
```typescript
// Sidebar.tsx
const drawerWidth = 280;
const collapsedDrawerWidth = 72;

function Sidebar({ collapsed = false, onCollapseToggle }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedDrawerWidth : drawerWidth,
        transition: 'width 0.2s',
        '& .MuiDrawer-paper': {
          width: collapsed ? collapsedDrawerWidth : drawerWidth,
          transition: 'width 0.2s',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Show icons only when collapsed */}
      {collapsed ? (
        <Box> {/* Mini sidebar with icons only */} </Box>
      ) : (
        <Box> {/* Full sidebar with labels */} </Box>
      )}
    </Drawer>
  );
}
```

---

### PROPOSAL 3 Summary
| Task | Description | Est. Hours | Dependencies |
|------|-------------|------------|--------------|
| P3-T1 | Persistent Sidebar | 6 | None |
| P3-T2 | Collapsible Sections | 8 | None |
| P3-T3 | Breadcrumbs | 4 | None |
| P3-T4 | Keyboard Shortcuts | 4 | None |
| P3-T5 | Notification Badges | 4 | None |
| P3-T6 | Collapse Toggle | 6 | None |
| **TOTAL** | | **32 hours** | |

---

### PROPOSAL 8: Empty States & Onboarding

**Objective:** Help users get started with onboarding flows and helpful empty states.

---

#### Task 8.1: Create Comprehensive EmptyState Component
**ID:** P8-T1 | **Priority:** High | **Est. Hours:** 6

**Description:**
Create a comprehensive EmptyState component with CTA buttons, illustrations, and tips.

**Files to Create:**
- `src/components/ui/EmptyState/EmptyState.tsx`
- `src/components/ui/EmptyState/EmptyState.types.ts`
- `src/components/ui/EmptyState/index.ts`

**Component API:**
```typescript
interface EmptyStateProps {
  illustration?: 'models' | 'logs' | 'search' | 'custom';
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tips?: string[];
  documentationUrl?: string;
}

interface EmptyStateIllustrationProps {
  type: 'models' | 'logs' | 'search' | 'monitoring';
  size?: 'small' | 'medium' | 'large';
}
```

**Usage Example:**
```typescript
<EmptyState
  illustration="models"
  title="No Models Found"
  description="Get started by adding your first AI model. Models are stored in your configured model directory."
  primaryAction={{
    label: 'Add Your First Model',
    onClick: handleAddModel,
    icon: <AddIcon />
  }}
  secondaryAction={{
    label: 'Scan Directory',
    onClick: handleScan,
  }}
  tips={[
    'Models are stored in /media/bamer/llm/llama/models',
    'Supported formats: .gguf, .safetensors',
    'Larger models may require more memory',
  ]}
  documentationUrl="/docs/models"
/>
```

---

#### Task 8.2: Implement Onboarding Flow
**ID:** P8-T2 | **Priority:** High | **Est. Hours:** 12

**Description:**
Design and implement OnboardingFlow component for new users with step-by-step guidance.

**Files to Create:**
- `src/components/onboarding/OnboardingFlow.tsx`
- `src/components/onboarding/OnboardingStep.tsx`
- `src/components/onboarding/WelcomeStep.tsx`
- `src/components/onboarding/ScanStep.tsx`
- `src/components/onboarding/ConfigureStep.tsx`
- `src/components/onboarding/CompleteStep.tsx`
- `src/hooks/use-onboarding.ts`

**Flow Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Welcome to Llama Runner Pro                        [Skip >]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              🦙 Welcome! 👋                                    │
│                                                                 │
│    Let's get you set up with your first AI model in just       │
│    a few simple steps.                                         │
│                                                                 │
│         ┌───────────────────────┐                               │
│         │   Get Started →      │                               │
│         └───────────────────────┘                               │
│                                                                 │
│    ⏱️ Takes about 2 minutes                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Scan for Models                            [1/3]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    Scanning for models...                                       │
│                                                                 │
│    Looking in: /media/bamer/llm/llama/models                    │
│                                                                 │
│    [ ████████░░░░░░░░░░░ ] 85% - Found 12 models              │
│                                                                 │
│         ┌───────────────────────┐                               │
│         │   Continue →         │                               │
│         └───────────────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Task 8.3: Add Animated Illustrations
**ID:** P8-T3 | **Priority:** Medium | **Est. Hours:** 8

**Description:**
Add animated illustrations to empty states and onboarding.

**Files to Create:**
- `src/components/ui/EmptyState/illustrations/*.svg` or Lottie files
- `src/components/ui/EmptyState/AnimatedIllustration.tsx`

**Implementation Options:**
- Use Framer Motion for CSS animations
- Use Lottie for complex animations
- Use SVG with CSS animations

**Animation Ideas:**
- Llama mascot waving
- Model loading animation
- Server connection animation
- Success celebration

---

#### Task 8.4: Add Tips and Documentation Links
**ID:** P8-T4 | **Priority:** Medium | **Est. Hours:** 4

**Description:**
Add helpful tips and documentation links to empty states.

**Files to Modify:**
- `src/components/ui/EmptyState/EmptyState.tsx`
- `src/components/pages/ModelsPage.tsx`
- `src/components/pages/LogsPage.tsx`

---

#### Task 8.5: First-Time Setup Wizard
**ID:** P8-T5 | **Priority:** Medium | **Est. Hours:** 8

**Description:**
Implement first-time setup wizard (welcome → scan → configure).

**Files to Modify/Create:**
- `src/app/layout.tsx` (check first-time flag)
- `src/components/setup/SetupWizard.tsx`
- `src/hooks/use-first-time.ts`

**Implementation:**
```typescript
function useFirstTime() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage(
    'has-seen-onboarding',
    false
  );

  const markAsSeen = () => setHasSeenOnboarding(true);

  return { hasSeenOnboarding, markAsSeen };
}

// In layout.tsx
const { hasSeenOnboarding } = useFirstTime();

if (!hasSeenOnboarding) {
  return <OnboardingFlow onComplete={() => markAsSeen(false)} />;
}

return <App />;
```

---

### PROPOSAL 8 Summary
| Task | Description | Est. Hours | Dependencies |
|------|-------------|------------|--------------|
| P8-T1 | EmptyState Component | 6 | None |
| P8-T2 | Onboarding Flow | 12 | None |
| P8-T3 | Animated Illustrations | 8 | P8-T1 |
| P8-T4 | Tips & Documentation | 4 | P8-T1 |
| P8-T5 | First-Time Setup | 8 | P8-T2 |
| **TOTAL** | | **38 hours** | |

---

### PROPOSAL 2: Modern Dashboard Redesign

**Objective:** Redesign dashboard with quick actions, visual hierarchy, and real-time indicators.

---

#### Task 2.1: Create QuickActionsBar Component
**ID:** P2-T1 | **Priority:** High | **Est. Hours:** 6

**Description:**
Create QuickActionsBar component for dashboard with prominent buttons.

**Files to Create:**
- `src/components/dashboard/QuickActionsBar.tsx`
- `src/components/dashboard/QuickActionButton.tsx`
- `src/components/dashboard/index.ts`

**Component API:**
```typescript
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
}

interface QuickActionsBarProps {
  actions: QuickAction[];
  title?: string;
}
```

**Actions to Include:**
1. **Start Server** - Primary action
2. **Stop Server** - Primary action (danger)
3. **Refresh All** - Secondary action
4. **Download Logs** - Secondary action
5. **Scan Models** - Secondary action

---

#### Task 2.2: Redesign ServerStatusCard
**ID:** P2-T2 | **Priority:** High | **Est. Hours:** 6

**Description:**
Redesign ServerStatusCard with visual indicators and uptime.

**Files to Create:**
- `src/components/dashboard/ServerStatusCard.tsx`

**Design:**
```
┌────────────────────────────────────────┐
│  Server Status              [⚙️ Edit] │
├────────────────────────────────────────┤
│                                          │
│    🟢 CONNECTED                        │
│                                          │
│    ┌──────────────────────────────────┐ │
│    │ Uptime: 2d 4h 30m                │ │
│    └──────────────────────────────────┘ │
│                                          │
│    CPU:    45% ████░░░░░░              │
│    Memory: 62% ██████░░░░              │
│    GPU:    78% ████████░░              │
│                                          │
│    Last Started: Jan 5, 2026 10:23 AM   │
│                                          │
└────────────────────────────────────────┘
```

---

#### Task 2.3: Add Sparklines to MetricCard
**ID:** P2-T3 | **Priority:** High | **Est. Hours:** 8

**Description:**
Add sparkline visualizations to MetricCard components for trend indicators.

**Files to Create/Modify:**
- `src/components/dashboard/MetricCard.tsx` (modify)
- `src/components/charts/Sparkline.tsx` (new)

**Implementation:**
```typescript
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showAxis?: boolean;
  animated?: boolean;
}

function Sparkline({ data, width = 100, height = 30, color }: SparklineProps) {
  // SVG-based sparkline implementation
  return (
    <svg width={width} height={height}>
      <path
        d={generatePath(data)}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}

// Usage in MetricCard:
<MetricCard
  title="CPU Usage"
  value={metrics.cpuUsage}
  unit="%"
  trend="up"
  sparklineData={history.cpuUsage}
  status={metrics.cpuUsage > 80 ? 'warning' : 'normal'}
/>
```

---

#### Task 2.4: Restructure MetricsGrid
**ID:** P2-T4 | **Priority:** High | **Est. Hours:** 6

**Description:**
Restructure MetricsGrid with logical grouping sections.

**Files to Modify:**
- `src/components/dashboard/MetricsGrid.tsx`

**New Structure:**
```typescript
function MetricsGrid({ metrics }) {
  return (
    <Box>
      {/* System Resources Section */}
      <Typography variant="h6" sx={{ mb: 2 }}>System Resources</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title="CPU" value={metrics.cpu} unit="%" icon={<CpuIcon />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title="Memory" value={metrics.memory} unit="%" icon={<MemoryIcon />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title="GPU" value={metrics.gpu} unit="%" icon={<GpuIcon />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title="Storage" value={metrics.storage} unit="%" icon={<StorageIcon />} />
        </Grid>
      </Grid>

      {/* Model Resources Section */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Model Resources</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title="Active Models" value={metrics.activeModels} icon={<BotIcon />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title="Total Tokens" value={metrics.tokens} icon={<TokenIcon />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title="Requests/min" value={metrics.requests} icon={<RequestIcon />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title="Avg Response" value={metrics.responseTime} unit="ms" icon={<ClockIcon />} />
        </Grid>
      </Grid>
    </Box>
  );
}
```

---

#### Task 2.5: Improve ChartsSection
**ID:** P2-T5 | **Priority:** Medium | **Est. Hours:** 6

**Description:**
Improve ChartsSection with labels, legends, and detailed tooltips.

**Files to Modify:**
- `src/components/dashboard/ChartsSection.tsx`

**Improvements:**
- Add chart titles and axis labels
- Add legend with color indicators
- Improve tooltip formatting
- Add chart type selector (line, area, bar)
- Add time range selector (1h, 6h, 24h, 7d)

---

#### Task 2.6: Add ActiveModelsSummary
**ID:** P2-T6 | **Priority:** Medium | **Est. Hours:** 6

**Description:**
Add ActiveModelsSummary section to dashboard.

**Files to Create:**
- `src/components/dashboard/ActiveModelsSummary.tsx`

**Design:**
```
┌────────────────────────────────────────────────────┐
│  Active Models (3)                     [View All →]│
├────────────────────────────────────────────────────┤
│  🔥 llama-7b-chat        45.2 tokens/s           │
│  🔥 mistral-7b-instruct  38.7 tokens/s           │
│  💤 codellama-7b         (idle)                  │
│                                                    │
│  Total Memory: 12.4 GB / 32 GB                    │
│  Active Requests: 4                               │
└────────────────────────────────────────────────────┘
```

---

### PROPOSAL 2 Summary
| Task | Description | Est. Hours | Dependencies |
|------|-------------|------------|--------------|
| P2-T1 | QuickActionsBar | 6 | P1-T2 |
| P2-T2 | ServerStatusCard | 6 | P1-T3 |
| P2-T3 | Sparklines | 8 | None |
| P2-T4 | MetricsGrid | 6 | None |
| P2-T5 | ChartsSection | 6 | None |
| P2-T6 | ActiveModelsSummary | 6 | None |
| **TOTAL** | | **38 hours** | |

---

## 📦 PHASE 3: Advanced Features

### Phase Goal: Implement advanced page-specific features.

---

### PROPOSAL 4: Modern Models Page

**Objective:** Redesign models page with rich cards, bulk actions, and advanced filtering.

---

#### Task 4.1: Redesign ModelCard
**ID:** P4-T1 | **Priority:** High | **Est. Hours:** 10

**Description:**
Redesign ModelCard with status, progress, stats, and quick actions.

**Files to Create/Modify:**
- `src/app/models/components/ModelCard.tsx` (redesign)
- `src/app/models/components/ModelCard.types.ts` (new)

**Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔥 llama-7b-chat.Q4_0.gguf                         [⋮]        │
│                                                                 │
│  📊 7B parameters  │  🖥️ 4.8 GB  │  📁 /models/               │
│                                                                 │
│  Status: 🟢 Running (2h 15m)                                    │
│  Progress: ████████████████████░░ 98%                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 45.2 tok/s │ 2 active req │ 4.2 GB used                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────┬──────────┬──────────┬──────────┐                │
│  │ ▶ Stop   │ ⚙️ Config│ 📊 Stats │ 📋 Clone│                │
│  └──────────┴──────────┴──────────┴──────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component API:**
```typescript
interface ModelCardProps {
  model: Model;
  onStart?: () => void;
  onStop?: () => void;
  onConfigure?: () => void;
  onStats?: () => void;
  onClone?: () => void;
  onMenu?: () => void;
  viewMode?: 'grid' | 'list';
}

interface ModelStats {
  tokensPerSecond?: number;
  activeRequests?: number;
  memoryUsed?: number;
  totalMemory?: number;
}
```

---

#### Task 4.2: Add View Toggle
**ID:** P4-T2 | **Priority:** High | **Est. Hours:** 6

**Description:**
Add view toggle switch (grid/list/table views) to ModelsPage.

**Files to Create/Modify:**
- `src/app/models/components/ViewToggle.tsx` (new)
- `src/app/models/page.tsx` (modify)

**Component API:**
```typescript
interface ViewToggleProps {
  value: 'grid' | 'list' | 'table';
  onChange: (value: 'grid' | 'list' | 'table') => void;
}

function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleButtonGroup value={value} exclusive onChange={(_, v) => v && onChange(v)}>
      <ToggleButton value="grid">
        <GridIcon />
      </ToggleButton>
      <ToggleButton value="list">
        <ListIcon />
      </ToggleButton>
      <ToggleButton value="table">
        <TableIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
```

---

#### Task 4.3: Implement Bulk Actions
**ID:** P4-T3 | **Priority:** High | **Est. Hours:** 10

**Description:**
Implement bulk actions toolbar (start/stop/delete multiple models).

**Files to Create:**
- `src/app/models/components/BulkActionsToolbar.tsx`
- `src/app/models/hooks/use-bulk-actions.ts`

**Component API:**
```typescript
interface BulkActionsToolbarProps {
  selectedCount: number;
  onStartSelected: () => void;
  onStopSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

function useBulkActions() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = (allIds: string[]) => setSelectedIds(allIds);
  const clearSelection = () => setSelectedIds([]);

  return {
    selectedIds,
    selectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    hasSelection: selectedIds.length > 0,
  };
}
```

---

#### Task 4.4: Improve Filtering UI
**ID:** P4-T4 | **Priority:** High | **Est. Hours:** 6

**Description:**
Improve filtering UI with MUI components and visual chips.

**Files to Create/Modify:**
- `src/app/models/components/ModelsFilters.tsx` (redesign)

**Design:**
```
Search models...        [Status ▼]  [Size ▼]  [Sort ▼]

Filter by:
  ✅ Running  ⏸️ Idle  ⚠️ Error  🟡 Loading
```

**Component API:**
```typescript
interface ModelsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: ModelStatus[];
  onStatusChange: (status: ModelStatus[]) => void;
  sizeFilter?: string[];
  onSizeChange?: (size: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
}
```

---

#### Task 4.5: Add Per-Model Statistics Panel
**ID:** P4-T5 | **Priority:** Medium | **Est. Hours:** 8

**Description:**
Add per-model statistics panel (tokens/sec, memory, etc.).

**Files to Create:**
- `src/app/models/components/ModelStatsPanel.tsx`

**Design:**
```
┌────────────────────────────────────────────────────┐
│  Model Statistics: llama-7b-chat           [✕]     │
├────────────────────────────────────────────────────┤
│                                                     │
│  Performance          Resource Usage               │
│  ─────────────        ───────────────              │
│  Tokens/sec: 45.2     Memory: 4.2 GB / 32 GB       │
│  Req Queue: 0         GPU: 2.4 GB / 8 GB          │
│  Avg Latency: 234ms   CPU: 45%                     │
│                                                     │
│  Mini Chart: ████████░░░░░░░░░░░░░░░░░░░░          │
│  Last 5 min token generation over time              │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

#### Task 4.6: Add Model Search with Highlighting
**ID:** P4-T6 | **Priority:** Medium | **Est. Hours:** 6

**Description:**
Add model search with real-time filtering and highlighting.

**Files to Create/Modify:**
- `src/app/models/components/ModelSearch.tsx`
- `src/app/models/page.tsx`

**Implementation:**
```typescript
function ModelSearch({ value, onChange, results }: ModelSearchProps) {
  return (
    <Box>
      <FormField
        type="search"
        placeholder="Search models by name, path, or tags..."
        value={value}
        onChange={onChange}
        startAdornment={<SearchIcon />}
        endAdornment={value && (
          <IconButton onClick={() => onChange('')}>
            <ClearIcon />
          </IconButton>
        )}
      />
      {results.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          Found {results.length} models
        </Typography>
      )}
    </Box>
  );
}

// Highlight matching text:
function HighlightedText({ text, highlight }: HighlightedTextProps) {
  if (!highlight) return <>{text}</>;

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i}>{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
```

---

### PROPOSAL 4 Summary
| Task | Description | Est. Hours | Dependencies |
|------|-------------|------------|--------------|
| P4-T1 | ModelCard Redesign | 10 | P1-T3 |
| P4-T2 | View Toggle | 6 | P1-T5 |
| P4-T3 | Bulk Actions | 10 | None |
| P4-T4 | Filtering UI | 6 | P1-T4 |
| P4-T5 | Stats Panel | 8 | None |
| P4-T6 | Search + Highlight | 6 | None |
| **TOTAL** | | **46 hours** | |

---

### PROPOSAL 5: Enhanced Logs Viewer

**Objective:** Transform logs page with syntax highlighting, export, and advanced filtering.

---

#### Task 5.1: Replace Raw HTML Inputs with MUI
**ID:** P5-T1 | **Priority:** High | **Est. Hours:** 4

**Description:**
Replace raw HTML inputs with MUI TextField/Select in LogsPage.

**Files to Modify:**
- `src/components/pages/LogsPage.tsx`

---

#### Task 5.2: Implement Syntax Highlighting
**ID:** P5-T2 | **Priority:** High | **Est. Hours:** 8

**Description:**
Implement syntax highlighting for log levels (color-coded badges).

**Files to Create:**
- `src/components/logs/LogLevelBadge.tsx`
- `src/components/logs/LogEntry.tsx`

**Implementation:**
```typescript
const LOG_LEVEL_COLORS = {
  error: { bg: '#fee2e2', text: '#b91c1c', icon: <ErrorIcon /> },
  warn: { bg: '#fef3c7', text: '#b45309', icon: <WarningIcon /> },
  info: { bg: '#dbeafe', text: '#1d4ed8', icon: <InfoIcon /> },
  debug: { bg: '#f3f4f6', text: '#4b5563', icon: <DebugIcon /> },
  trace: { bg: '#f5f5f5', text: '#6b7280', icon: <TraceIcon /> },
};

function LogLevelBadge({ level }: LogLevelBadgeProps) {
  const color = LOG_LEVEL_COLORS[level] || LOG_LEVEL_COLORS.debug;
  return (
    <Chip
      icon={color.icon}
      label={level.toUpperCase()}
      size="small"
      sx={{
        backgroundColor: color.bg,
        color: color.text,
        fontWeight: 600,
        fontSize: '0.7rem',
      }}
    />
  );
}
```

---

#### Task 5.3: Add Collapsible Log Details
**ID:** P5-T3 | **Priority:** High | **Est. Hours:** 6

**Description:**
Add collapsible log details (stack traces, context expandable).

**Files to Create:**
- `src/components/logs/CollapsibleLogEntry.tsx`

**Implementation:**
```typescript
function CollapsibleLogEntry({ log, defaultExpanded = false }: CollapsibleLogEntryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasDetails = log.stack || log.context || Object.keys(log.metadata || {}).length > 0;

  return (
    <Box>
      <Box onClick={() => setExpanded(!expanded)} sx={{ cursor: hasDetails ? 'pointer' : 'default' }}>
        <LogEntry log={log} />
        {hasDetails && (
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ pl: 4, mt: 1 }}>
          {log.stack && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Stack Trace</Typography>
              <pre>{log.stack}</pre>
            </Box>
          )}
          {log.context && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Context</Typography>
              <pre>{JSON.stringify(log.context, null, 2)}</pre>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
```

---

#### Task 5.4: Add Auto-Scroll Toggle
**ID:** P5-T4 | **Priority:** High | **Est. Hours:** 6

**Description:**
Add auto-scroll toggle with live indicator.

**Files to Create/Modify:**
- `src/components/logs/AutoScrollToggle.tsx`
- `src/components/pages/LogsPage.tsx`

**Implementation:**
```typescript
function AutoScrollToggle({ enabled, onToggle }: AutoScrollToggleProps) {
  return (
    <Tooltip title={enabled ? 'Disable auto-scroll' : 'Enable auto-scroll'}>
      <IconButton onClick={() => onToggle(!enabled)} color={enabled ? 'primary' : 'default'}>
        {enabled ? <SyncIcon className="spinning" /> : <SyncDisabledIcon />}
        {enabled && (
          <span className="live-indicator" />
        )}
      </IconButton>
    </Tooltip>
  );
}
```

---

#### Task 5.5: Add Export Functionality
**ID:** P5-T5 | **Priority:** High | **Est. Hours:** 8

**Description:**
Add export functionality (JSON, CSV, plain text).

**Files to Create:**
- `src/utils/log-export.ts`
- `src/components/logs/ExportMenu.tsx`

**Implementation:**
```typescript
type ExportFormat = 'json' | 'csv' | 'text' | 'html';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  maxLines: number;
  levelFilter?: string[];
}

function exportLogs(logs: LogEntry[], options: ExportOptions): void {
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (options.format) {
    case 'json':
      content = JSON.stringify(logs.slice(0, options.maxLines), null, 2);
      filename = `logs-${Date.now()}.json`;
      mimeType = 'application/json';
      break;
    case 'csv':
      content = convertToCSV(logs.slice(0, options.maxLines));
      filename = `logs-${Date.now()}.csv`;
      mimeType = 'text/csv';
      break;
    case 'text':
      content = convertToText(logs.slice(0, options.maxLines));
      filename = `logs-${Date.now()}.txt`;
      mimeType = 'text/plain';
      break;
    case 'html':
      content = generateHTMLReport(logs.slice(0, options.maxLines));
      filename = `logs-${Date.now()}.html`;
      mimeType = 'text/html';
      break;
  }

  downloadFile(content, filename, mimeType);
}
```

---

#### Task 5.6: Add Log Bookmarking
**ID:** P5-T6 | **Priority:** Medium | **Est. Hours:** 8

**Description:**
Add log bookmarking and bookmark management.

**Files to Create:**
- `src/hooks/use-log-bookmarks.ts`
- `src/components/logs/BookmarksPanel.tsx`

---

#### Task 5.7: Implement Regex Search
**ID:** P5-T7 | **Priority:** Medium | **Est. Hours:** 8

**Description:**
Implement regex search with highlighted results.

**Files to Create/Modify:**
- `src/components/logs/RegexSearchInput.tsx`
- `src/components/pages/LogsPage.tsx`

---

### PROPOSAL 5 Summary
| Task | Description | Est. Hours | Dependencies |
|------|-------------|------------|--------------|
| P5-T1 | Replace Inputs | 4 | P1-T4 |
| P5-T2 | Syntax Highlighting | 8 | None |
| P5-T3 | Collapsible Details | 6 | None |
| P5-T4 | Auto-Scroll Toggle | 6 | None |
| P5-T5 | Export Function | 8 | None |
| P5-T6 | Bookmarking | 8 | None |
| P5-T7 | Regex Search | 8 | None |
| **TOTAL** | | **48 hours** | |

---

### PROPOSAL 6: Real-Time Monitoring Dashboard

**Objective:** Create comprehensive monitoring with health scores and alerts.

---

#### Task 6.1: Create HealthScoreCard
**ID:** P6-T1 | **Priority:** High | **Est. Hours:** 8

**Description:**
Create HealthScoreCard with visual indicator (Excellent/Good/Poor).

**Files to Create:**
- `src/components/monitoring/HealthScoreCard.tsx`

**Design:**
```
┌────────────────────────────────────────────────┐
│  System Health                                │
├────────────────────────────────────────────────┤
│                                                │
│        ╭───────────────────────────╮          │
│        │         92 / 100          │          │
│        │   🟢 EXCELLENT            │          │
│        ╰───────────────────────────╯          │
│                                                │
│  ✓ CPU Normal    ✓ Memory Normal              │
│  ✓ GPU Normal    ✓ Storage Normal             │
│  ✓ Network Normal  ✓ Temperature Normal       │
│                                                │
└────────────────────────────────────────────────┘
```

---

#### Task 6.2: Redesign GPU Metrics Display
**ID:** P6-T2 | **Priority:** High | **Est. Hours:** 8

**Description:**
Redesign GPU metrics display with dedicated cards per GPU.

**Files to Create:**
- `src/components/monitoring/GPUCard.tsx`

**Design:**
```
┌────────────────────────────────────────────────┐
│  GPU 0: NVIDIA RTX 3090              [⚙️ ⚡] │
├────────────────────────────────────────────────┤
│                                                │
│  Usage: 78% ██████████████░░░░░░░              │
│  Memory: 12 GB / 24 GB ██████████░░            │
│  Temperature: 68°C                            │
│  Power: 185 W / 350 W                         │
│  Fan Speed: 45%                               │
│                                                │
│  Processes:                                   │
│  • llama-7b: 4.2 GB                           │
│  • mistral-7b: 3.8 GB                         │
│                                                │
└────────────────────────────────────────────────┘
```

---

#### Task 6.3: Implement Alert System
**ID:** P6-T3 | **Priority:** High | **Est. Hours:** 12

**Description:**
Implement configurable alert system with threshold settings.

**Files to Create:**
- `src/components/monitoring/AlertConfigDialog.tsx`
- `src/components/monitoring/AlertList.tsx`
- `src/hooks/use-alerts.ts`
- `src/types/alert.ts`

**Alert Types:**
- CPU threshold exceeded
- Memory threshold exceeded
- GPU memory threshold exceeded
- Temperature threshold exceeded
- Model stopped unexpectedly
- Server connection lost

---

#### Task 6.4: Improve Charts Interactivity
**ID:** P6-T4 | **Priority:** Medium | **Est. Hours:** 8

**Description:**
Improve charts with zoom, pan, and detailed hover tooltips.

**Files to Modify:**
- `src/components/charts/PerformanceChart.tsx`

---

#### Task 6.5: Add Metrics Export
**ID:** P6-T5 | **Priority:** Medium | **Est. Hours:** 6

**Description:**
Add metrics export (CSV/JSON) functionality.

**Files to Create:**
- `src/utils/metrics-export.ts`

---

#### Task 6.6: Implement Historical Data Viewer
**ID:** P6-T6 | **Priority:** Medium | **Est. Hours:** 10

**Description:**
Implement historical data viewer (time range selection).

**Files to Create:**
- `src/components/monitoring/TimeRangeSelector.tsx`
- `src/components/monitoring/HistoricalChart.tsx`

---

### PROPOSAL 6 Summary
| Task | Description | Est. Hours | Dependencies |
|------|-------------|------------|--------------|
| P6-T1 | HealthScoreCard | 8 | None |
| P6-T2 | GPU Metrics Cards | 8 | None |
| P6-T3 | Alert System | 12 | P7-T1 |
| P6-T4 | Interactive Charts | 8 | None |
| P6-T5 | Metrics Export | 6 | None |
| P6-T6 | Historical Data | 10 | None |
| **TOTAL** | | **52 hours** | |

---

## 📦 PHASE 4: Performance & Polish

### Phase Goal: Optimize performance and polish user experience.

---

### PROPOSAL 10: Performance Optimizations

**Objective:** Improve perceived performance and add progressive loading patterns.

---

#### Task 10.1: Implement Optimistic Updates
**ID:** P10-T1 | **Priority:** High | **Est. Hours:** 8

**Description:**
Implement optimistic UI updates for all async actions.

**Files to Modify:**
- `src/app/models/hooks/use-models.ts`
- `src/app/models/hooks/use-model-actions.ts`

**Implementation:**
```typescript
function useModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);

  const startModel = useCallback(async (modelId: string) => {
    // Optimistic update
    setModels(prev => prev.map(m =>
      m.id === modelId ? { ...m, status: 'starting' } : m
    ));

    try {
      await startModelAPI(modelId);
      // Success - update to running
      setModels(prev => prev.map(m =>
        m.id === modelId ? { ...m, status: 'running' } : m
      ));
    } catch (error) {
      // Rollback on error
      setModels(prev => prev.map(m =>
        m.id === modelId ? { ...m, status: 'idle' } : m
      ));
      throw error;
    }
  }, []);

  return { models, loading, startModel, ... };
}
```

---

#### Task 10.2: Add Skeleton Loading States
**ID:** P10-T2 | **Priority:** High | **Est. Hours:** 8

**Description:**
Add skeleton loading states to all major components.

**Files to Create:**
- `src/components/ui/Skeleton/SkeletonCard.tsx`
- `src/components/ui/Skeleton/SkeletonTable.tsx`
- `src/components/ui/Skeleton/SkeletonList.tsx`

**Implementation:**
```typescript
interface SkeletonCardProps {
  variant?: 'card' | 'list-item' | 'stats';
  count?: number;
}

function SkeletonCard({ variant = 'card', count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          animation="wave"
          sx={{ borderRadius: variant === 'card' ? 3 : 1 }}
        />
      ))}
    </>
  );
}
```

---

#### Task 10.3: Implement Virtual Scrolling
**ID:** P10-T3 | **Priority:** Medium | **Est. Hours:** 10

**Description:**
Implement virtual scrolling for large model lists (>100 items).

**Files to Create:**
- `src/components/ui/VirtualList.tsx`

**Implementation:**
```typescript
interface VirtualListProps {
  items: any[];
  itemHeight: number;
  overscan?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

function VirtualList({ items, itemHeight, overscan = 3, renderItem }: VirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight) - overscan;
  const endIndex = Math.min(
    startIndex + Math.ceil(containerRef.current?.clientHeight || 0 / itemHeight) + overscan * 2,
    items.length
  );

  const visibleItems = items.slice(Math.max(0, startIndex), endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <Box ref={containerRef} sx={{ height: '100%', overflowY: 'auto' }}>
      <Box sx={{ height: totalHeight, position: 'relative' }}>
        <Box sx={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => renderItem(item, startIndex + index))}
        </Box>
      </Box>
    </Box>
  );
}
```

---

#### Task 10.4: Add Progressive Loading
**ID:** P10-T4 | **Priority:** Medium | **Est. Hours:** 8

**Description:**
Add progressive loading (initial 10, load more on scroll).

**Files to Create/Modify:**
- `src/hooks/use-progressive-list.ts`
- `src/app/models/page.tsx`

---

#### Task 10.5: Implement Smart Prefetching
**ID:** P10-T5 | **Priority:** Medium | **Est. Hours:** 6

**Description:**
Implement smart prefetching for dashboard data.

**Files to Create:**
- `src/hooks/use-prefetch.ts`

---

#### Task 10.6: Add Global Search
**ID:** P10-T6 | **Priority:** Medium | **Est. Hours:** 12

**Description:**
Add global search in header (search models, logs, settings).

**Files to Create:**
- `src/components/ui/GlobalSearch/GlobalSearch.tsx`
- `src/components/ui/GlobalSearch/GlobalSearchDialog.tsx`

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Search models, logs, settings...]              [Cmd+K] │
└─────────────────────────────────────────────────────────────┘

// Cmd+K opens modal:
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search                                          [✕]    │
├─────────────────────────────────────────────────────────────┤
│  [                                                    ]    │
│                                                             │
│  Models (3)                                                │
│  ─────────────────────────────────────────────────────────  │
│  🔹 llama-7b-chat        Running                          │
│  🔹 mistral-7b-instruct  Idle                             │
│  🔹 codellama-7b         Error                            │
│                                                             │
│  Settings (2)                                              │
│  ─────────────────────────────────────────────────────────  │
│  🔹 Server Settings       General                         │
│  🔹 Model Defaults        Configuration                   │
│                                                             │
│  Logs (1)                                                  │
│  ─────────────────────────────────────────────────────────  │
│  🔹 TypeError in models-api.ts                           │
│                                                             │
│  [→ Navigate]  [↵ Select]  [ESC Close]                    │
└─────────────────────────────────────────────────────────────┘
```

---

### PROPOSAL 10 Summary
| Task | Description | Est. Hours | Dependencies |
|------|-------------|------------|--------------|
| P10-T1 | Optimistic Updates | 8 | None |
| P10-T2 | Skeleton Loading | 8 | None |
| P10-T3 | Virtual Scrolling | 10 | None |
| P10-T4 | Progressive Loading | 8 | None |
| P10-T5 | Smart Prefetching | 6 | None |
| P10-T6 | Global Search | 12 | None |
| **TOTAL** | | **52 hours** | |

---

## 📊 Implementation Timeline Summary

| Phase | Proposals | Tasks | Hours |
|-------|-----------|-------|-------|
| Phase 1 | Proposal 1 | 8 | 41 |
| Phase 2 | Proposals 2, 3, 7, 8 | 26 | 130 |
| Phase 3 | Proposals 4, 5, 6 | 19 | 146 |
| Phase 4 | Proposal 10 | 6 | 52 |
| **TOTAL** | | **55** | **369 hours** |

### Weekly Breakdown

| Week | Focus | Main Deliverables |
|------|-------|-------------------|
| 1 | Foundation | Design System, Toast System, Empty States |
| 2 | Navigation | Persistent Sidebar, Breadcrumbs, Quick Actions |
| 3 | Core Features | Models Page V1, Logs Page V1 |
| 4 | Advanced | Alert System, Monitoring V2, Stats Panels |
| 5 | Polish | Skeletons, Optimistic Updates, Search |
| 6 | Testing & Bug Fixes | All integration, bug fixes |
| 7 | Documentation & Polish | Component docs, final polish |
| 8 | Final Review | All deliverables complete |

---

## 🔗 Dependency Graph

```
P1-T1 (Design Tokens)
    │
    ├── P1-T2 (Button) ───► P2-T1 (QuickActionsBar)
    ├── P1-T3 (Card) ─────► P2-T2 (ServerStatusCard)
    │                       └── P4-T1 (ModelCard)
    ├── P1-T4 (FormField) ─► P1-T6 (LogsPage Inputs)
    │                       └── P1-T7 (ModelsPage UI)
    └── P1-T5 (Table) ─────► P4-T2 (View Toggle)

P7-T1 (Toast Lib) ───► P7-T2 (ToastProvider)
    │                   └── P7-T3 (Add Toasts)
    │                   └── P7-T4 (Notification Types)
    │                   └── P7-T5 (Inline Alerts)
    │                   └── P6-T3 (Alert System)

P8-T1 (EmptyState) ──► P8-T2 (Onboarding)
    └── P8-T3 (Illustrations)

P10-T1 (Optimistic) ─► P4-T3 (Bulk Actions)
```

---

## ✅ Approval Checklist

Please review and approve the implementation plan:

- [ ] **Phase 1: Foundation** - Design system, unified components
- [ ] **Phase 2: Core Components** - Navigation, Toast, Empty States, Quick Actions
- [ ] **Phase 3: Advanced Features** - Models Page, Logs Page, Monitoring
- [ ] **Phase 4: Performance** - Optimistic updates, skeletons, global search
- [ ] **Timeline** - 6-8 weeks total
- [ ] **Dependencies** - All dependencies identified and documented
- [ ] **Hours** - Total ~369 hours

**Approved by:** ____________________

**Approval Date:** ____________________

**Comments/Notes:** ____________________

---

## 📚 Appendix

### A. File Structure Changes

```
src/
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── FormField/
│   │   ├── Table/
│   │   ├── EmptyState/
│   │   ├── Skeleton/
│   │   ├── GlobalSearch/
│   │   └── Toast/
│   ├── dashboard/
│   │   ├── QuickActionsBar.tsx
│   │   ├── ServerStatusCard.tsx
│   │   ├── ActiveModelsSummary.tsx
│   │   └── charts/
│   │       └── Sparkline.tsx
│   ├── monitoring/
│   │   ├── HealthScoreCard.tsx
│   │   ├── GPUCard.tsx
│   │   └── AlertConfigDialog.tsx
│   ├── logs/
│   │   ├── LogLevelBadge.tsx
│   │   ├── CollapsibleLogEntry.tsx
│   │   ├── AutoScrollToggle.tsx
│   │   └── ExportMenu.tsx
│   └── onboarding/
│       ├── OnboardingFlow.tsx
│       └── OnboardingStep.tsx
├── hooks/
│   ├── use-toast.ts
│   ├── use-keyboard-nav.ts
│   ├── use-bulk-actions.ts
│   ├── use-log-bookmarks.ts
│   ├── use-prefetch.ts
│   └── use-progressive-list.ts
└── styles/
    └── component-tokens.ts
```

### B. New Dependencies

```json
{
  "dependencies": {
    "sonner": "^1.7.0",
    "react-window": "^1.8.10",
    "@tanstack/react-virtual": "^3.10.0"
  },
  "devDependencies": {
    "@types/sonner": "^0.1.0",
    "@types/react-window": "^1.8.8"
  }
}
```

### C. Component Usage Examples

**Before (Current):**
```tsx
<button
  onClick={handleStart}
  className="bg-primary text-primary-foreground px-4 py-2 rounded"
>
  Start Server
</button>
```

**After (Unified):**
```tsx
<Button variant="primary" onClick={handleStart}>
  Start Server
</Button>
```

---

**Document Version:** 1.0  
**Last Updated:** January 5, 2026  
**Next Review:** Upon approval
