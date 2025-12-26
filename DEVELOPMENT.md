# Development Guide

## Getting Started

### Prerequisites

- **Node.js 18+** (verify with `node --version`)
- **pnpm 9+** (install with `npm install -g pnpm`)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd nextjs-llama-async-proxy

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Development Workflow

### Daily Commands

```bash
# Start development server
pnpm dev

# In another terminal, run tests
pnpm test:watch

# Check for issues before committing
pnpm lint
pnpm type:check
```

### Commit Workflow

Before committing code:

```bash
# 1. Fix any linting issues
pnpm lint:fix

# 2. Check TypeScript
pnpm type:check

# 3. Run tests
pnpm test

# 4. Build to verify production build works
pnpm build

# 5. Commit
git add .
git commit -m "Clear, descriptive message"
```

---

## Project Structure

### Key Directories

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── logs/              # Logs page
│   ├── models/            # Models management
│   ├── monitoring/        # Monitoring page
│   └── settings/          # Settings page
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── pages/            # Page components
│   ├── ui/               # Reusable UI components
│   └── websocket/        # WebSocket manager
├── hooks/                # Custom React hooks
├── services/             # API calls & utilities
├── types/                # TypeScript types
├── contexts/             # React Context
├── config/               # Configuration
├── lib/                  # Utility libraries
├── server/               # Backend logic (not frontend)
└── styles/               # Global styles

app/                       # Next.js App Router (root)
pages/                     # Legacy pages (SSE only)
server.js                  # Express + Socket.IO server
```

### Path Aliases

- `@/` → `src/`
- `@/components/` → `src/components/`
- `@/hooks/` → `src/hooks/`
- `@/types/` → `src/types/`

Use these in imports:
```typescript
import { Button } from "@/components/ui/Button";
import { useApi } from "@/hooks/use-api";
```

---

## Code Style

### TypeScript Guidelines

**Strict Mode** is enabled - follow these rules:

```typescript
// ✅ Explicit return types
function getData(): Promise<Data> {
  return fetch('/api/data').then(r => r.json());
}

// ✅ No implicit any
const process = (value: string): void => {
  console.log(value);
};

// ✅ Optional chaining & nullish coalescing
const value = obj?.prop ?? defaultValue;

// ❌ Never use !
const value = someValue!;  // Don't do this

// ❌ Never use any
const data: any = {};  // Use unknown instead
```

### Formatting

**2 spaces, double quotes, 100 chars per line:**

```typescript
import { useState } from "react";

export function MyComponent(): React.ReactNode {
  const [count, setCount] = useState<number>(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Naming Conventions

```typescript
// Functions/variables: camelCase
const getUserData = (): User => { ... };
let isLoading = false;

// Components: PascalCase
export function MyButton(): React.ReactNode { ... }

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;
const API_TIMEOUT = 5000;

// Files match export name
// MyButton.tsx exports MyButton

// Hooks: start with "use"
const useApi = (): ApiResult => { ... };
const useWebSocket = (): WebSocketState => { ... };

// Unused parameters: prefix with _
const handler = (_event: Event, data: string) => { ... };
```

### Import Order

```typescript
// 1. Node.js built-ins
import { readFile } from "fs";
import { parse } from "url";

// 2. External packages
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";

// 3. Internal imports (sorted alphabetically)
import { Button } from "@/components/ui/Button";
import { useApi } from "@/hooks/use-api";
import { fetchData } from "@/services/api";

// 4. Parent/sibling relative imports
import { helper } from "../helper";
import { local } from "./local";
```

---

## React Best Practices

### Functional Components Only

```typescript
// ✅ Correct
export function MyComponent(): React.ReactNode {
  const [state, setState] = useState<string>("");
  
  return <div>{state}</div>;
}

// ❌ Wrong (class components not used)
class MyComponent extends React.Component { ... }
```

### Hooks Best Practices

```typescript
// ✅ Correct - dependencies are exhaustive
useEffect(() => {
  const timer = setTimeout(() => {
    setData(newData);
  }, 1000);
  
  return () => clearTimeout(timer);
}, [newData]);  // Include all dependencies

// ❌ Wrong - missing dependency
useEffect(() => {
  setData(newData);  // Forgot newData in deps
}, []);
```

### Props Typing

```typescript
// ✅ Correct
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({
  label,
  onClick,
  disabled = false,
}: ButtonProps): React.ReactNode {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ Wrong (no prop-types, no untyped props)
export function Button(props) { ... }
```

---

## Server-Side Code (server.js)

The Express + Socket.IO server is in `server.js`:

```javascript
// server.js structure:
1. Logger setup
2. Next.js app preparation
3. Express app creation
4. Socket.IO configuration
5. Update intervals (metrics, models, logs)
6. Socket.IO event handlers
7. Server startup

// Update intervals (configurable):
METRICS_INTERVAL: 10000,  // 10 seconds
MODELS_INTERVAL: 30000,   // 30 seconds
LOGS_INTERVAL: 15000,     // 15 seconds
```

Backend logic goes in `src/server/`:
- `config.js` - Configuration management
- `models.js` - Model management
- `metrics.js` - Metrics collection
- `logs.js` - Log management
- `proxy.js` - Proxy utilities

---

## State Management

### Zustand (Global Client State)

```typescript
import { create } from 'zustand';

interface AppStore {
  count: number;
  increment: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Usage in component
export function Counter(): React.ReactNode {
  const { count, increment } = useAppStore();
  return <button onClick={increment}>Count: {count}</button>;
}
```

### React Query (Server State)

```typescript
import { useQuery } from '@tanstack/react-query';

export function UserProfile({ id }: { id: string }): React.ReactNode {
  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{data?.name}</div>;
}
```

---

## Forms & Validation

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function LoginForm(): React.ReactNode {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## Styling

### Tailwind CSS (Primary)

```typescript
export function Card({ title }: { title: string }): React.ReactNode {
  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
  );
}
```

### Emotion (Complex Styles)

```typescript
import styled from '@emotion/styled';

const StyledButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  
  &:hover {
    background-color: #0056b3;
  }
`;

export function Button(): React.ReactNode {
  return <StyledButton>Click me</StyledButton>;
}
```

### MUI (Complex Components)

```typescript
import { Button, Card, CardContent } from '@mui/material';

export function MyCard(): React.ReactNode {
  return (
    <Card>
      <CardContent>
        <Button variant="contained" color="primary">
          Click me
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## Testing

### Jest + React Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    await userEvent.click(screen.getByText('Click me'));
    
    expect(onClick).toHaveBeenCalled();
  });

  it('renders disabled state', () => {
    render(<Button disabled>Click me</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick} disabled>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
```

### Run Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test -- src/components/Button.test.tsx

# Generate coverage report
pnpm test:coverage
```

---

## API Integration

### Fetch Data

```typescript
// Service pattern
export async function getModels(): Promise<Model[]> {
  const response = await fetch('/api/models');
  if (!response.ok) throw new Error('Failed to fetch models');
  return response.json();
}

// Usage in component
export function Models(): React.ReactNode {
  const { data, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getModels,
  });

  return (
    <div>
      {isLoading ? 'Loading...' : data?.map(m => <div key={m.id}>{m.name}</div>)}
    </div>
  );
}
```

### WebSocket (Socket.IO)

```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000');

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('metrics', (event) => setData(event.data));

    return () => socket.disconnect();
  }, []);

  return { isConnected, data };
}
```

---

## Error Handling

### Try/Catch Pattern

```typescript
async function loadData(): Promise<Data> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to load data:', error);
    throw error;  // Re-throw to let component handle
  }
}
```

### Error Boundaries

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    console.error('Error caught:', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <div>Something went wrong: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}
```

---

## Performance Tips

### Code Splitting

```typescript
// Next.js automatically code-splits each page
// Use dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
});
```

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

export function ExpensiveComponent({ items }: { items: string[] }): React.ReactNode {
  // Memoize expensive computation
  const filtered = useMemo(() => {
    return items.filter(item => item.length > 5);
  }, [items]);

  // Memoize callback
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return (
    <div>
      {filtered.map(item => (
        <button key={item} onClick={handleClick}>{item}</button>
      ))}
    </div>
  );
}
```

### Image Optimization

```typescript
import Image from 'next/image';

export function ProfileImage(): React.ReactNode {
  return (
    <Image
      src="/avatar.jpg"
      alt="User avatar"
      width={64}
      height={64}
      priority  // For above-the-fold images
    />
  );
}
```

---

## Debugging

### Browser DevTools

- **Elements**: Inspect DOM structure
- **Console**: View logs and errors
- **Network**: Check API calls
- **Sources**: Set breakpoints

### VS Code Debugging

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Node.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server.js",
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

### Logging

```typescript
// Server (Winston)
import logger from '@/server/logger';
logger.info('User logged in');
logger.error('Database connection failed');

// Client (console - restricted to error/warn)
console.error('Critical error:', error);
console.warn('This is deprecated');

// Avoid in production
// console.log('debug info');  // ❌ Not allowed
```

---

## Common Tasks

### Add a New Page

1. Create file: `app/my-page/page.tsx`
2. Export default React component
3. Update sidebar navigation if needed

```typescript
// app/my-page/page.tsx
export default function MyPage(): React.ReactNode {
  return <div>My page content</div>;
}
```

### Add a New Component

```bash
# Create component file
touch src/components/MyComponent.tsx
```

```typescript
// src/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps): React.ReactNode {
  return <div>{title}</div>;
}
```

### Add a New Hook

```bash
# Create hook file
touch src/hooks/useMyHook.ts
```

```typescript
// src/hooks/useMyHook.ts
import { useState } from 'react';

export function useMyHook(): { value: string } {
  const [value, setValue] = useState<string>('');
  return { value };
}
```

### Add a New API Route

```bash
# Create API route
touch app/api/my-route/route.ts
```

```typescript
// app/api/my-route/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ message: 'Hello' });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();
  return NextResponse.json({ success: true, data });
}
```

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Socket.IO](https://socket.io/docs/)
- [Zod Validation](https://zod.dev)
- [React Hook Form](https://react-hook-form.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Query](https://tanstack.com/query/latest)

---

## Getting Help

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review [AGENTS.md](AGENTS.md) for standards
3. Check the relevant documentation file
4. Ask in the team channel with:
   - Clear error message
   - Steps to reproduce
   - Your Node.js/pnpm version
