# Models Database Integration - Quick Reference

## Database Imports

```typescript
import { getModels, saveModel, updateModel, deleteModel } from '@/lib/database';
import type { ModelConfig as DatabaseModelConfig } from '@/lib/database';
```

## Loading Models from Database

```typescript
// In component mount
useEffect(() => {
  const dbModels = getModels();
  const storeModels = dbModels.map(databaseToStoreModel);
  setModels(storeModels);
}, []);
```

## Type Conversion Helpers

### Database → Store
```typescript
function databaseToStoreModel(dbModel: DatabaseModelConfig): import('@/types').ModelConfig {
  const typeMap: Record<string, "llama" | "mistral" | "other"> = {
    llama: "llama",
    gpt: "other",
    mistrall: "mistral", // Database has typo
    custom: "other",
  };

  return {
    id: dbModel.id?.toString() || '',
    name: dbModel.name,
    type: typeMap[dbModel.type] || 'other',
    parameters: { /* ... */ },
    status: dbModel.status === 'running' || dbModel.status === 'loading' || dbModel.status === 'error'
      ? dbModel.status
      : 'idle',
    createdAt: dbModel.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: dbModel.updated_at?.toISOString() || new Date().toISOString(),
  };
}
```

### Store → Database
```typescript
function storeToDatabaseModel(storeModel: import('@/types').ModelConfig): Omit<DatabaseModelConfig, 'id' | 'created_at' | 'updated_at'> {
  const typeMap: Record<"llama" | "mistral" | "other", "llama" | "gpt" | "mistrall" | "custom"> = {
    llama: "llama",
    mistral: "mistrall",
    other: "custom",
  };

  return {
    name: storeModel.name,
    type: typeMap[storeModel.type] || 'llama',
    status: storeModel.status === 'running' || storeModel.status === 'loading' || storeModel.status === 'error'
      ? storeModel.status
      : 'stopped',
    ctx_size: (storeModel.parameters?.ctx_size as number) ?? 0,
    batch_size: (storeModel.parameters?.batch_size as number) ?? 2048,
    // ... other fields
  };
}
```

## Saving/Updating a Model

```typescript
const handleSaveModel = (config: Partial<import('@/types').ModelConfig>) => {
  const allModels = useStore.getState().models;
  const existing = allModels.find((m) => m.name === config.name);

  if (existing) {
    // Update existing
    updateStoreModel(existing.id, config);
    updateModel(parseInt(existing.id, 10), storeToDatabaseModel({...existing, ...config}));
  } else if (config.name) {
    // Create new
    const newModel: import('@/types').ModelConfig = {
      id: Date.now().toString(), // Temporary
      name: config.name!,
      type: config.type || 'llama',
      status: 'idle',
      // ... other fields
    };

    const dbId = saveModel(storeToDatabaseModel(newModel));
    newModel.id = dbId.toString();
    useStore.getState().addModel(newModel);
  }
};
```

## Updating Model Status

```typescript
const handleStartModel = async (modelId: string) => {
  const model = useStore.getState().models.find((m) => m.id === modelId);

  // Update store for UI
  updateStoreModel(modelId, { status: 'loading' });

  // Update database (non-blocking)
  try {
    updateModel(parseInt(modelId, 10), { status: 'loading' });
  } catch (err) {
    console.error('Failed to update model in database:', err);
  }

  // Start model via API...
  const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.ok) {
    updateStoreModel(modelId, { status: 'running' });
    updateModel(parseInt(modelId, 10), { status: 'running' });
  }
};
```

## Deleting a Model

```typescript
const handleDeleteModel = (modelId: string) => {
  // Remove from store
  useStore.getState().removeModel(modelId);

  // Remove from database (non-blocking)
  try {
    deleteModel(parseInt(modelId, 10));
  } catch (err) {
    console.error('Failed to delete model from database:', err);
  }
};
```

## Database API Reference

### `getModels(filters?)`
Get all models from database with optional filters.

```typescript
const models = getModels();
const runningModels = getModels({ status: 'running' });
const llamaModels = getModels({ type: 'llama' });
```

### `saveModel(config)`
Save a new model to database. Returns the new model's ID.

```typescript
const dbId = saveModel({
  name: 'my-model',
  type: 'llama',
  status: 'stopped',
  ctx_size: 4096,
  // ... other config fields
});
console.log('New model ID:', dbId);
```

### `updateModel(id, updates)`
Update an existing model in database.

```typescript
updateModel(123, {
  status: 'running',
  ctx_size: 8192,
  temperature: 0.7,
});
```

### `deleteModel(id)`
Delete a model from database by ID.

```typescript
deleteModel(123);
```

### `getModelByName(name)`
Get a single model by name.

```typescript
const model = getModelByName('my-model');
if (model) {
  console.log('Model found:', model.id);
}
```

### `getModelById(id)`
Get a single model by ID.

```typescript
const model = getModelById(123);
if (model) {
  console.log('Model:', model.name);
}
```

## Best Practices

1. **Always use non-blocking pattern**:
   ```typescript
   try {
     updateModel(id, updates);
   } catch (err) {
     console.error('Database operation failed:', err);
   }
   ```

2. **Update store first, then database**:
   - Store updates provide immediate UI feedback
   - Database updates happen asynchronously in background

3. **Type conversion is required**:
   - Database uses numeric IDs
   - Store uses string IDs
   - Status values differ ('stopped' vs 'idle')
   - Type values differ ('mistrall' vs 'mistral')

4. **Use helper functions**:
   - `databaseToStoreModel()` for loading from database
   - `storeToDatabaseModel()` for saving to database

5. **Handle missing IDs**:
   ```typescript
   const dbId = parseInt(storeModelId, 10);
   if (isNaN(dbId)) {
     console.error('Invalid model ID');
     return;
   }
   ```

## Type Differences

| Field | Store Type | Database Type |
|-------|-----------|---------------|
| id | `string` | `number` (auto-increment) |
| type | `"llama" \| "mistral" \| "other"` | `"llama" \| "gpt" \| "mistrall" \| "custom"` |
| status | `"idle" \| "loading" \| "running" \| "error"` | `"stopped" \| "loading" \| "running" \| "error"` |
| createdAt | `string` (ISO 8601) | `number` (timestamp) |
| updatedAt | `string` (ISO 8601) | `number` (timestamp) |
| ctx_size | `parameters.ctx_size` | Top-level field |
| batch_size | `parameters.batch_size` | Top-level field |

## Common Patterns

### Load models on component mount
```typescript
useEffect(() => {
  try {
    const dbModels = getModels();
    const storeModels = dbModels.map(databaseToStoreModel);
    setModels(storeModels);
  } catch (err) {
    console.error('Failed to load models:', err);
  }
}, []);
```

### Sync with WebSocket
```typescript
// WebSocket updates → Store + Database
useEffect(() => {
  const handleMessage = (message) => {
    if (message.type === 'models') {
      setModels(message.data);

      // Sync to database
      message.data.forEach((model) => {
        const existing = getModels().find(m => m.name === model.name);
        if (existing) {
          updateModel(existing.id, storeToDatabaseModel(model));
        } else {
          saveModel(storeToDatabaseModel(model));
        }
      });
    }
  };

  websocket.on('message', handleMessage);
  return () => websocket.off('message', handleMessage);
}, []);
```

### Save model configuration
```typescript
const saveModelConfig = async (name: string, config: any) => {
  // Check if model exists
  const existing = useStore.getState().models.find(m => m.name === name);

  if (existing) {
    // Update existing
    updateStoreModel(existing.id, { ...config });
    try {
      updateModel(parseInt(existing.id, 10), storeToDatabaseModel({...existing, ...config}));
    } catch (err) {
      console.error('Failed to update model:', err);
    }
  } else {
    // Create new
    const newModel = {
      id: Date.now().toString(),
      name,
      type: 'llama',
      status: 'idle' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parameters: config,
    };

    try {
      const dbId = saveModel(storeToDatabaseModel(newModel));
      newModel.id = dbId.toString();
      useStore.getState().addModel(newModel);
    } catch (err) {
      console.error('Failed to save model:', err);
    }
  }
};
```

## Troubleshooting

### "Model not found" errors
- Ensure you're using the correct ID format (string for store, number for database)
- Check if the model exists in store before database operations

### Type errors
- Use helper functions for type conversion
- Ensure you're importing the correct `ModelConfig` type
- Remember that database and store have different type definitions

### Database operations failing silently
- Always wrap database operations in try-catch
- Check console for error logs
- Verify database file exists and is writable

### Status not updating in UI
- Ensure you're updating the store, not just the database
- Store updates trigger re-renders, database updates don't
- Update store first for immediate UI feedback

### WebSocket and database out of sync
- WebSocket data takes precedence over database
- Database provides fallback on connection issues
- Both are updated on user actions for consistency
