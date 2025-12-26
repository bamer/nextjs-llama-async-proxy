# Quick Reference Guide

## Installation & Setup

```bash
# Install pnpm (first time only)
npm install -g pnpm@latest

# Clone and setup
git clone <repository-url>
cd nextjs-llama-async-proxy
pnpm install

# Start development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Essential Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server (Next.js + Express + Socket.IO) |
| `pnpm build` | Build for production |
| `pnpm start` | Run production server |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Check for linting issues |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm type:check` | Check TypeScript types |
| `pnpm test:coverage` | Generate coverage report |

---

## Before Committing Code

```bash
# 1. Fix linting
pnpm lint:fix

# 2. Check types
pnpm type:check

# 3. Run tests
pnpm test

# 4. Build (verify production build works)
pnpm build

# 5. Commit
git add .
git commit -m "Your message"
```

---

## Project Structure

```
├── app/                    # Next.js pages (root)
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   ├── services/         # API calls
│   ├── types/            # TypeScript types
│   ├── contexts/         # React contexts
│   ├── server/           # Backend logic
│   └── styles/           # Global styles
├── public/               # Static files
├── pages/api/            # Legacy SSE endpoint
└── server.js             # Express + Socket.IO
```

---

## Common Code Patterns

### Component
```typescript
import { useState } from "react";

interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps): React.ReactNode {
  const [count, setCount] = useState<number>(0);
  
  return <div>{title}: {count}</div>;
}
```

### Hook
```typescript
import { useState } from "react";

export function useMyHook(): { value: string } {
  const [value, setValue] = useState<string>("");
  return { value };
}
```

### API Call
```typescript
import { useQuery } from '@tanstack/react-query';

export function useData(): { data: any } {
  const { data } = useQuery({
    queryKey: ['data'],
    queryFn: () => fetch('/api/data').then(r => r.json()),
  });
  
  return { data };
}
```

### Form (with Zod)
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export function MyForm(): React.ReactNode {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Styling Approaches

### Tailwind CSS (Primary)
```typescript
<div className="rounded-lg border border-gray-200 p-4 shadow-sm">
  Content
</div>
```

### Emotion (Complex)
```typescript
import styled from '@emotion/styled';

const Wrapper = styled.div`
  padding: 20px;
  border-radius: 8px;
`;
```

### Material-UI
```typescript
import { Card, CardContent } from '@mui/material';

<Card><CardContent>Content</CardContent></Card>
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Functions | camelCase | `getUserData` |
| Variables | camelCase | `isLoading` |
| Components | PascalCase | `MyButton` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |
| Hooks | useXxx | `useApi` |
| Files | Match export | `MyButton.tsx` |
| Unused params | Prefix `_` | `(_unused, required)` |

---

## Import Order

```typescript
// 1. Node.js built-ins
import { readFile } from "fs";

// 2. External packages
import { useState } from "react";
import axios from "axios";

// 3. Internal (@/...)
import { Button } from "@/components/ui/Button";

// 4. Relative imports
import { helper } from "../helper";
```

---

## Debugging

### Browser Console
```javascript
// Check WebSocket connection
socket.on('connect', () => console.log('Connected'));

// Check data updates
socket.on('metrics', (data) => console.log('Metrics:', data));
```

### VS Code
- F12: Browser DevTools
- F5: Debug (with launch.json)
- Ctrl+Shift+B: Build task

### Logging
```typescript
// Server
logger.info('Message');
logger.error('Error message');

// Client (console restricted)
console.error('Error');
console.warn('Warning');
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `PORT=3001 pnpm dev` |
| TypeScript errors | `pnpm type:check` |
| Linting errors | `pnpm lint:fix` |
| Dependencies broken | `rm -rf node_modules pnpm-lock.yaml && pnpm install` |
| WebSocket not connecting | Check `NEXT_PUBLIC_WS_URL` in .env.local |
| Build fails | `pnpm build` after `pnpm lint:fix` |

---

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

---

## API Endpoints

### Models
- `GET /api/models` - List models
- `POST /api/models` - Create model
- `DELETE /api/models/:id` - Delete model

### Configuration
- `GET /api/config` - Get config
- `POST /api/config` - Update config

### Real-time
- **WebSocket**: `/socket.io` (Socket.IO)
- **SSE**: `/api/sse` (Server-Sent Events)

---

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Express + Socket.IO server |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript configuration |
| `.eslintrc.json` | ESLint rules |
| `.prettierrc` | Code formatting |
| `jest.config.js` | Testing configuration |

---

## Required Versions

- Node.js: 18+
- pnpm: 9+
- TypeScript: 5.9+
- React: 19.2+
- Next.js: 16.1+

Check versions:
```bash
node --version
pnpm --version
npm ls typescript
```

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [AGENTS.md](AGENTS.md) - Code standards
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) - Deployment

---

## Remember

✅ Always use **pnpm** (not npm/yarn)
✅ Follow **AGENTS.md** for code style
✅ Run **pnpm lint:fix** before committing
✅ Use **TypeScript** with strict mode
✅ Test with **pnpm test**
✅ Deploy with **pnpm build && pnpm start**

❌ Never use npm/yarn
❌ Don't use `any` type
❌ Don't skip linting
❌ Don't commit with errors
❌ Don't use `console.log` in production code
