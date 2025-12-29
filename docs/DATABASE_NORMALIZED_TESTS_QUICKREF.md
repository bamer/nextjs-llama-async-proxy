# Normalized Database Schema Tests - Quick Reference

## What Was Created

**File:** `__tests__/lib/database-normalized.test.ts`

## Test Overview

This file contains comprehensive tests for a **TO-BE IMPLEMENTED** normalized database schema. All tests are currently **skipped** (using `describe.skip`) until the normalized schema is implemented in `src/lib/database.ts`.

## Test Suites

### 1. Core Models Table Tests
- ✅ Save model core with minimal fields
- ✅ Get model core by ID (lazy loading - no config fields)
- ✅ Get all models with core fields only
- ✅ Filter models by status, type, name
- ✅ Update model core fields
- ✅ Update model with config parameters
- ✅ Delete model and cascade configs
- ✅ Delete all models
- ✅ Timestamp management (created_at, updated_at)

### 2. Sampling Config Tests
- ✅ Save sampling configuration (temperature, top_k, top_p)
- ✅ Save all sampling parameters (min_p, typical_p, repeat penalties)
- ✅ Update sampling configuration
- ✅ Cascade delete sampling config on model delete
- ✅ Handle DRY sampling parameters
- ✅ Handle dynamic temperature parameters (dynatemp)
- ✅ Handle Mirostat sampling parameters

### 3. Server Config Tests (CRITICAL - NO FK)
- ✅ Save server config independent of model
- ✅ **NOT cascade delete server config on model delete** (KEY DESIGN PRINCIPLE)
- ✅ Save all server parameters (host, port, api_key, ssl certs, etc.)
- ✅ Update server config parameters
- ✅ Use default server config values
- ✅ Allow multiple models to share same server config

### 4. Memory Config Tests
- ✅ Save memory configuration (cache_ram, mmap)
- ✅ Save all memory parameters (cache_type_k/v, mlock, numa, defrag_thold)
- ✅ Update memory configuration
- ✅ Cascade delete memory config on model delete
- ✅ Handle unlimited cache_ram (-1)

### 5. GPU Config Tests
- ✅ Save GPU configuration (device, gpu_layers)
- ✅ Save all GPU parameters (split_mode, tensor_split, main_gpu, kv_offload)
- ✅ Update GPU configuration
- ✅ Cascade delete GPU config on model delete
- ✅ Handle auto GPU layers (-1)

### 6. Advanced Config Tests
- ✅ Save advanced memory configuration (swa_full, override_tensor)
- ✅ Save MoE configuration (cpu_moe, n_cpu_moe, kv_unified)
- ✅ Save grammar constraints (grammar, json_schema)
- ✅ Save RoPE scaling parameters (rope_scaling_type, rope_scale)
- ✅ Save YaRN parameters
- ✅ Cascade delete advanced config on model delete

### 7. LoRA Config Tests
- ✅ Save LoRA configuration
- ✅ Save scaled LoRA adapters
- ✅ Save control vector configuration
- ✅ Update LoRA configuration
- ✅ Cascade delete LoRA config on model delete

### 8. Multimodal Config Tests
- ✅ Save multimodal configuration (mmproj)
- ✅ Save all multimodal parameters (mmproj_url, image tokens)
- ✅ Update multimodal configuration
- ✅ Cascade delete multimodal config on model delete

### 9. Full Model Save Tests
- ✅ Save model with all configurations
- ✅ Save model with every config type
- ✅ Allow partial config saves (lazy loading)
- ✅ Maintain consistency across all config tables
- ✅ Update only specified configs on partial update

### 10. Cascade Delete Behavior Tests
- ✅ **Cascade delete all configs EXCEPT server config** (CRITICAL TEST)
- ✅ Cascade delete configs for multiple models independently
- ✅ Handle deleting all models

## Schema Design

### Tables

| Table | FK to models_core | Cascade Delete | Purpose |
|-------|-------------------|-----------------|----------|
| models_core | - | - | Core model fields (id, name, type, status, timestamps) |
| models_sampling | Yes | Yes | Sampling parameters (temperature, top_k, top_p, etc.) |
| models_memory | Yes | Yes | Memory configuration (cache_ram, mmap, etc.) |
| models_gpu | Yes | Yes | GPU offloading (device, gpu_layers, etc.) |
| models_advanced | Yes | Yes | Advanced parameters (MoE, grammar, RoPE, etc.) |
| models_lora | Yes | Yes | LoRA and control vectors |
| models_multimodal | Yes | Yes | Multimodal configuration |
| models_server | **NO** | **NO** | Server configuration (persists after model deletion) |

## Key Design Principles

1. **Lazy Loading**: Only load config tables when needed (via getConfig functions)
2. **Cascade Delete**: All config tables (except server) cascade delete on model delete
3. **Server Independence**: models_server has NO FK - server config persists after model deletion
4. **Type Safety**: Each config has its own TypeScript interface
5. **Partial Saves**: Models can be saved with minimal configs

## Implementation Required

To make these tests pass, implement these functions in `src/lib/database.ts`:

### Core Model Functions

```typescript
function saveModel(
  config: Omit<ModelConfig, "id" | "created_at" | "updated_at">
): number;

function getModelCoreById(id: number): ModelCore | null;

function getModels(filters?: {
  status?: string;
  type?: string;
  name?: string;
}): ModelCore[];

function updateModel(
  id: number,
  updates: Partial<Omit<ModelConfig, "id" | "name" | "type" | "created_at">>
): void;

function deleteModel(id: number): void;

function deleteAllModels(): void;
```

### Config Getter Functions (Lazy Loading)

```typescript
function getSamplingConfig(modelId: number): SamplingConfig | null;

function getServerConfig(modelId: number): ServerConfig | null;

function getMemoryConfig(modelId: number): MemoryConfig | null;

function getGPUConfig(modelId: number): GPUConfig | null;

function getAdvancedConfig(modelId: number): AdvancedConfig | null;

function getLoRAConfig(modelId: number): LoRAConfig | null;

function getMultimodalConfig(modelId: number): MultimodalConfig | null;
```

## How to Run Tests

### Current Status (Skipped)

```bash
# Run tests - will all be skipped until implementation
pnpm test __tests__/lib/database-normalized.test.ts
```

### After Implementation

1. **Remove `describe.skip`** from each test suite in the test file
2. **Implement functions** listed above in `src/lib/database.ts`
3. **Create normalized schema tables** in database initialization

```bash
# Run tests - all tests should pass
pnpm test __tests__/lib/database-normalized.test.ts

# Run with coverage
pnpm test:coverage __tests__/lib/database-normalized.test.ts
```

## Example: Removing Skip Markers

Once functions are implemented, find and replace:

```typescript
// Before (skipped)
describe.skip("Normalized Database Schema - Core Models Table", () => {
  it.skip("should save model core...", () => {
    // test code
  });
});

// After (enabled)
describe("Normalized Database Schema - Core Models Table", () => {
  it("should save model core...", () => {
    // test code
  });
});
```

## Next Steps

1. ✅ **Tests created** - This file is complete
2. ⏳ **Implement normalized schema** in `src/lib/database.ts`
3. ⏳ **Create TypeScript interfaces** for each config type
4. ⏳ **Implement functions** listed above
5. ⏳ **Remove skip markers** from test file
6. ⏳ **Run tests** and ensure all pass
7. ⏳ **Integrate with UI** - Use getConfig functions for lazy loading

## Benefits of Normalized Schema

1. **Performance**: Load only what you need (lazy loading)
2. **Flexibility**: Easy to add new config types
3. **Maintainability**: Clear separation of concerns
4. **Server Independence**: Server config persists after model deletion
5. **Type Safety**: Each config has dedicated interface
6. **Scalability**: Efficient queries with proper indexes

## Related Files

- `src/lib/database.ts` - Implement normalized schema here
- `__tests__/lib/database-normalized.test.ts` - This test file
- `__tests__/lib/database.test.ts` - Tests for current monolithic schema
- `docs/DATABASE_SCHEMA.md` - Schema documentation (needs update for normalized schema)

## Questions?

See inline comments in test file for detailed test scenarios and expected behavior.
