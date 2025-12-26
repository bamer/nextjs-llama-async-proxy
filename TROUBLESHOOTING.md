# Troubleshooting Guide

## Common Issues and Solutions

### 1. Port 3000 Already in Use

**Symptom**: Error "EADDRINUSE: address already in use :::3000"

**Solutions**:

#### Option A: Use a different port
```bash
PORT=3001 pnpm dev
```

#### Option B: Kill the process using port 3000
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

### 2. WebSocket Connection Failed

**Symptoms**:
- "WebSocket not connected" message in console
- Metrics/models not updating in real-time
- Repeated connection timeout errors

**Solutions**:

#### Check server is running
```bash
# Verify server is listening
curl http://localhost:3000

# Check WebSocket endpoint
curl http://localhost:3000/llamaproxws
```

#### Check WebSocket URL configuration
In `.env.local`:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

#### Verify firewall rules
- Allow inbound connections to port 3000
- Check if corporate firewall blocks WebSocket

#### Review server logs
```bash
# Start with debug logging
pnpm dev 2>&1 | grep -i socket
```

#### Browser console errors
1. Open DevTools (F12)
2. Check Console tab for specific errors
3. Check Network tab for failed WebSocket connections

---

### 3. TypeScript Compilation Errors

**Symptoms**:
- Build fails with TypeScript errors
- Unused variable/import warnings
- Type mismatches

**Solutions**:

#### Run type checking
```bash
pnpm type:check
```

#### Remove unused imports
```typescript
// ❌ Before
import { Card, Divider, Button } from "@mui/material";

// ✅ After
import { Card, Button } from "@mui/material";
```

#### Fix type mismatches
```typescript
// ❌ Before
const value: string = 123;

// ✅ After
const value: number = 123;
// OR
const value: string = "123";
```

#### Mark unused parameters
```typescript
// ❌ Before
function handler(event, unused) {
  return event.data;
}

// ✅ After
function handler(event, _unused) {
  return event.data;
}
```

---

### 4. pnpm Dependency Issues

**Symptoms**:
- "Cannot find module" errors
- Package not found after installation
- Build fails with missing dependencies

**Solutions**:

#### Clean reinstall dependencies
```bash
# Remove lock file and node_modules
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install --frozen-lockfile
```

#### Update pnpm
```bash
npm install -g pnpm@latest
pnpm --version  # Should be 9.x or higher
```

#### Verify using pnpm (not npm or yarn)
```bash
# ✅ Correct
pnpm dev
pnpm install

# ❌ Wrong
npm dev
npm install
yarn dev
```

#### Check Node.js version
```bash
node --version  # Should be 18.x or higher
```

---

### 5. Build Fails in Production

**Symptoms**:
- `pnpm build` fails with various errors
- Works in dev but not after build
- "Module not found" during production build

**Solutions**:

#### Full clean rebuild
```bash
# Remove all build artifacts
rm -rf .next node_modules pnpm-lock.yaml

# Reinstall and rebuild
pnpm install --frozen-lockfile
pnpm build
```

#### Check environment variables
```bash
# Verify .env.local has correct values
cat .env.local

# Or use defaults
NEXT_PUBLIC_WS_URL=ws://localhost:3000 pnpm build
```

#### Check disk space
```bash
df -h  # macOS/Linux
diskpart (Windows)
```

#### Verify Node.js and pnpm versions
```bash
node --version  # 18+
pnpm --version  # 9+
npm --version   # Only for installing pnpm globally
```

---

### 6. Development Server Issues

**Symptom**: Dev server crashes or hangs

**Solutions**:

#### Check for infinite loops
Look for:
- Infinite `useEffect` hooks
- Circular dependencies
- Memory leaks

#### Clear Next.js cache
```bash
rm -rf .next .swc
pnpm dev
```

#### Check console for error messages
Start with full output:
```bash
pnpm dev 2>&1 | tee dev.log
```

---

### 7. Socket.IO Connection Issues

**Symptoms**:
- Socket.IO errors in console
- Real-time updates not working
- Multiple connection errors

**Solutions**:

#### Verify Socket.IO path
Default: `/llamaproxws` (configured in `server.js`)

Check in browser console:
```javascript
// Open DevTools console and check:
// You should see Socket.IO debug messages
```

#### Check CORS settings
In `server.js`, CORS is open:
```javascript
cors: {
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

For production, restrict origin:
```javascript
cors: {
  origin: 'https://your-domain.com',
  methods: ['GET', 'POST']
}
```

#### Verify update intervals
In `server.js`:
```javascript
const UPDATE_CONFIG = {
  METRICS_INTERVAL: 10000,  // 10 seconds
  MODELS_INTERVAL: 30000,   // 30 seconds
  LOGS_INTERVAL: 15000,     // 15 seconds
};
```

---

### 8. Memory Leaks or High Memory Usage

**Symptoms**:
- Application getting slower over time
- Memory usage increasing
- Server crashes after running for a while

**Solutions**:

#### Monitor memory usage
```bash
# macOS/Linux
top -p <PID>
ps aux | grep node

# Windows
tasklist | findstr node
wmic process where name="node.exe" get WorkingSetSize
```

#### Check for memory leaks
- Look for event listeners not being removed
- Check for circular references
- Review WebSocket connection cleanup

#### Restart periodically
Use PM2 with restart:
```javascript
// ecosystem.config.js
max_memory_restart: "500M",  // Restart if exceeds 500MB
```

---

### 9. ESLint Errors

**Symptom**: Linting fails with `pnpm lint`

**Solutions**:

#### Auto-fix linting issues
```bash
pnpm lint:fix
```

#### Check specific rules
Common issues:
- Import ordering
- Unused variables (mark with `_`)
- Missing return types
- console.log() in non-test files

#### Disable rule for specific line
```typescript
// eslint-disable-next-line rule-name
const value = calculateSomething();
```

---

### 10. React/Component Errors

**Symptoms**:
- "Cannot read property X of undefined"
- White screen with error in console
- Component not rendering

**Solutions**:

#### Check component exports
```typescript
// ✅ Correct
export function Button() { ... }
export default Button;

// ❌ Wrong (missing export)
function Button() { ... }
```

#### Use optional chaining
```typescript
// ❌ Old way (crashes if undefined)
const value = data.nested.property;

// ✅ Safe way
const value = data?.nested?.property;
```

#### Add error boundaries
Wrap components that might error:
```typescript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

### 11. Deployment Issues

**Symptom**: Works locally but fails on production

**Solutions**:

#### Verify environment variables
```bash
# Check all required env vars are set
NEXT_PUBLIC_WS_URL=... pnpm build
NEXT_PUBLIC_API_BASE_URL=... pnpm start
```

#### Check Node.js version on server
```bash
node --version
```

#### Verify build output
```bash
# After build, check .next directory exists
ls -la .next/
```

#### Test production build locally
```bash
pnpm build
pnpm start
# Open http://localhost:3000
```

---

### 12. Git/Commit Issues

**Common issues**:
- "pre-commit hook failed" (ESLint errors)
- Merge conflicts in lock file
- Revert unwanted changes

**Solutions**:

#### Fix linting before commit
```bash
pnpm lint:fix
git add .
git commit -m "message"
```

#### Resolve pnpm-lock.yaml conflicts
```bash
# Remove and regenerate lock file
rm pnpm-lock.yaml
pnpm install
git add pnpm-lock.yaml
git commit -m "resolve lock file"
```

#### Check git status
```bash
git status
git diff
```

---

## Getting Help

### Information to collect when asking for help

1. **Error message** (exact text)
2. **Node.js version**: `node --version`
3. **pnpm version**: `pnpm --version`
4. **Operating system**: Windows/macOS/Linux
5. **Steps to reproduce**
6. **Console output**: Run with `2>&1 | tee debug.log`

### Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Socket.IO Troubleshooting](https://socket.io/docs/v4/troubleshooting-connection-issues/)
- [pnpm Documentation](https://pnpm.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Check Related Documents

- [README.md](README.md) - Project overview
- [AGENTS.md](AGENTS.md) - Development guidelines
- [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) - Production deployment
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration options
