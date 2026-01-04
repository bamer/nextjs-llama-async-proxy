# LlamaService Refactoring - Before & After

## Before (785 lines in single file)

```
src/server/services/LlamaService.ts (785 lines)
├── Imports & Types (lines 1-66)
├── Constructor (lines 67-98)
├── Public API
│   ├── onStateChange (lines 100-105)
│   ├── getState (lines 107-112)
│   ├── start (lines 114-151)
│   └── stop (lines 153-186)
├── Process Management
│   ├── healthCheck (lines 188-198)
│   ├── spawnServer (lines 200-254)
│   └── waitForReady (lines 256-282)
├── Model Loading
│   ├── loadModels (lines 284-345)
│   └── loadModelsFromFilesystem (lines 347-485)
├── Error Handling
│   └── handleCrash (lines 487-524)
├── Configuration
│   └── buildArgs (lines 526-713)
└── State Management
    ├── updateState (lines 715-730)
    ├── emitStateChange (lines 732-743)
    ├── startUptimeTracking (lines 745-761)
    └── logger (lines 763-785)
```

**Issues:**
- ❌ Single file too large (785 lines)
- ❌ Multiple responsibilities mixed together
- ❌ Difficult to test individual concerns
- ❌ Hard to maintain and modify
- ❌ Poor code organization

---

## After (9 files, all < 200 lines)

### File Structure

```
src/server/services/
├── LlamaService.ts (179 lines) ← Main orchestrator
└── llama/
    ├── types.ts (83 lines) ← Type definitions
    ├── ProcessManager.ts (101 lines) ← Process lifecycle
    ├── HealthCheck.ts (74 lines) ← Health monitoring
    ├── ModelLoader.ts (182 lines) ← Model loading
    ├── StateManager.ts (152 lines) ← State management
    ├── RetryHandler.ts (100 lines) ← Retry logic
    ├── HttpService.ts (101 lines) ← HTTP client
    └── ArgumentBuilder.ts (154 lines) ← Config to args
```

### Module Responsibilities

#### 1. LlamaService.ts (179 lines) - Main Orchestrator
```typescript
export class LlamaService {
  private processManager: ProcessManager;
  private healthCheck: HealthCheck;
  private modelLoader: ModelLoader;
  private stateManager: StateManager;
  private retryHandler: RetryHandler;
  private httpService: HttpService;

  // Public API
  constructor(config: LlamaServerConfig)
  onStateChange(callback: (state) => void): void
  getState(): LlamaServiceState
  async start(): Promise<void>
  async stop(): Promise<void>

  // Private orchestration
  private async spawnServer(): Promise<void>
  private async loadModels(): Promise<void>
  private async handleCrash(): Promise<void>
}
```

#### 2. ProcessManager.ts (101 lines)
```typescript
export class ProcessManager {
  async spawnServer(
    onReady: () => Promise<void>,
    onError: (error: Error) => void,
    onExit: (code, signal) => void
  ): Promise<void>
  async stop(): Promise<void>
  isRunning(): boolean
}
```

#### 3. HealthCheck.ts (74 lines)
```typescript
export class HealthCheck {
  async check(): Promise<boolean>
  async waitForReady(): Promise<void>
  updateConfig(maxChecks?: number, intervalMs?: number): void
}
```

#### 4. ModelLoader.ts (182 lines)
```typescript
export class ModelLoader {
  async loadModels(): Promise<LlamaModel[]>
  private loadModelsFromFilesystem(): LlamaModel[]
}
```

#### 5. StateManager.ts (152 lines)
```typescript
export class StateManager {
  onStateChange(callback: (state) => void): void
  getState(): LlamaServiceState
  updateState(status: LlamaServiceStatus, error?: string): void
  updateModels(models: LlamaModel[]): void
  incrementRetries(): void
  resetRetries(): void
  getRetries(): number
  getStatus(): LlamaServiceStatus
  getLastError(): string | null
  startUptimeTracking(): void
  stopUptimeTracking(): void
  reset(): void
}
```

#### 6. RetryHandler.ts (100 lines)
```typescript
export class RetryHandler {
  async retry(currentRetries: number, retryFn: () => Promise<void>, onFailure?: () => void): Promise<void>
  getMaxRetries(): number
  shouldRetry(currentRetries: number): boolean
  calculateDelay(retryCount: number): number
  updateConfig(maxRetries?: number, backoffMs?: number, maxWait?: number): void
}
```

#### 7. HttpService.ts (101 lines)
```typescript
export class HttpService {
  async healthCheck(): Promise<boolean>
  async getModels(): Promise<LlamaModel[]>
  async get<T>(path: string): Promise<T | null>
  async post<T>(path: string, data: unknown): Promise<T | null>
  updateBaseURL(host: string, port: number): void
  updateTimeout(timeoutMs: number): void
  getClient(): AxiosInstance
}
```

#### 8. ArgumentBuilder.ts (154 lines)
```typescript
export function buildArgs(config: LlamaServerConfig): string[]
```

#### 9. types.ts (83 lines)
```typescript
export interface LlamaServerConfig { ... }
export interface LlamaModel { ... }
export type LlamaServiceStatus = "initial" | "starting" | "ready" | "error" | "crashed" | "stopping";
export interface LlamaServiceState { ... }
```

---

## Benefits of Refactoring

### ✅ Improved Code Organization
- Each module has a single, well-defined responsibility
- Clear separation of concerns
- Easy to locate and understand specific functionality

### ✅ Enhanced Maintainability
- Smaller files are easier to read and modify
- Changes are localized to specific modules
- Reduced risk of introducing bugs

### ✅ Better Testability
- Individual modules can be unit tested in isolation
- Mock dependencies easily
- Higher test coverage achievable

### ✅ Increased Reusability
- Modules can be reused in other contexts
- HttpService can be used for other API clients
- ArgumentBuilder can be used for other CLI tools

### ✅ Clear Dependencies
- Explicit dependency graph
- Easier to understand flow
- Better for refactoring

---

## Dependency Graph

```
LlamaService (Orchestrator)
│
├─→ ProcessManager
│   └─→ ArgumentBuilder
│
├─→ HealthCheck
│   └─→ HttpService
│
├─→ ModelLoader
│   └─→ HttpService
│
├─→ StateManager
│
├─→ RetryHandler
│
└─→ HttpService

All modules ─→ types (shared)
```

---

## Migration Guide

### No Changes Required for Existing Code
All public APIs remain unchanged:

```typescript
// Old usage (still works)
const service = new LlamaService(config);
await service.start();
const state = service.getState();
service.onStateChange((state) => console.log(state));
await service.stop();
```

### Internal Refactoring Only
The refactoring is entirely internal - no breaking changes for consumers.

---

## File Sizes Comparison

| File | Lines | Status |
|------|-------|--------|
| **Before: LlamaService.ts** | 785 | ❌ Too large |
| **After: LlamaService.ts** | 179 | ✅ Focused orchestrator |
| ProcessManager.ts | 101 | ✅ Process lifecycle |
| HealthCheck.ts | 74 | ✅ Health monitoring |
| ModelLoader.ts | 182 | ✅ Model loading |
| StateManager.ts | 152 | ✅ State management |
| RetryHandler.ts | 100 | ✅ Retry logic |
| HttpService.ts | 101 | ✅ HTTP client |
| ArgumentBuilder.ts | 154 | ✅ Config to args |
| types.ts | 83 | ✅ Type definitions |
| **Total** | **1,126** | ✅ Modular & maintainable |

All files under 200 lines! ✅
