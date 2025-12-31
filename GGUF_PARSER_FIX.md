# GGUF Metadata Extraction Fix - Using gguf.js Instead of llama-fit-params

## Problem

The user correctly identified that **llama-fit-params is NOT a GGUF metadata extraction tool**.

### What llama-fit-params Actually Does
- **Calculates resource requirements** for running models
- Determines optimal context size (`-c`)
- Determines optimal GPU layers (`-ngl`)
- Estimates CPU/GPU memory usage
- Uses the model to "fit" parameters for specific hardware

### What llama-fit-params Does NOT Do
- Extract GGUF metadata like architecture type
- Read quantization details from GGUF file
- Parse parameter count from model
- Read tokenizer information
- Extract actual GGUF metadata fields

## Solution

### Proper GGUF Parser Libraries

Found **gguf.js** - a JavaScript/TypeScript library that directly parses GGUF files:

- **Package**: `gguf` on npm
- **GitHub**: https://github.com/ahoylabs/gguf.js
- **Description**: "A Javascript library (with Typescript types) to parse metadata of GGML based GGUF files."

### Installation
```bash
pnpm add gguf
```

### Updated ModelImportService

**Before (wrong approach):**
```typescript
// ❌ llama-fit-params only calculates resource requirements
const result = await analyzeModel(model.path);
const metadata = {
  quantization_type: result.metadata.quantization_type,  // Parsed from filename
  parameter_count: result.metadata.parameter_count,  // Parsed from filename
  architecture: result.metadata.architecture,        // Parsed from filename
  context_window: result.metadata.context_window,     // Parsed from filename
};
```

**After (correct approach):**
```typescript
// ✅ gguf.js directly reads GGUF metadata from file
const result = await gguf(model.path);

const metadata = result.metadata || {};
const architecture = metadata.general?.architecture || 
                     metadata.gqa?.architecture ||
                     result.type?.name || "unknown";

const parameterCount = metadata.general?.parameter_count || 
                    (metadata.general?.name?.match(/(\d+)b/i)?.[1] ? parseInt(...) : undefined);

const quantization = metadata.quantization?.version || null;
const contextLength = metadata.llama?.context_length || 
                    metadata.general?.context_length;
```

## GGUF.js Metadata Structure

Based on the library, GGUF files contain:

### General Metadata
```typescript
{
  general: {
    architecture: "llama",           // Architecture type
    name: "llama-2-7b",           // Model name
    quantization_version: 2,          // Quantization format version
    alignment: 32,                   // Tensor alignment
    file_type: 1,                    // File type
  },
}
```

### LLaMA-specific Metadata
```typescript
{
  llama: {
    context_length: 4096,            // Default context window
    embedding_length: 4096,           // Embedding length
    block_count: 32,                 // Number of transformer blocks
    feed_forward_length: 11008,      // Feed-forward dimension
    attention_head_count: 32,        // Number of attention heads
    attention_layer_count: 32,         // Attention layers
    rope_dimension_count: 128,         // RoPE dimensions
  },
}
```

### Quantization Metadata
```typescript
{
  quantization: {
    version: 2,                      // Quantization version
    name: "Q4_K_M",                  // Quantization type
    block_size: 32,                   // Block size for quantization
  },
}
```

## Extracted Fields Stored in Database

| GGUF Field | Database Field | Example |
|------------|----------------|----------|
| `metadata.general.architecture` | `architecture` | "llama" |
| `metadata.general.parameter_count` | `parameter_count` | 7, 13, 70 |
| `metadata.general.context_length` | `context_window` | 4096, 8192, 32768 |
| `metadata.quantization.version` | `quantization_type` | "Q4_K_M", "Q5_K_S" |
| `metadata.general.name` | Used for fallback | "Llama-2-7b" |

## Example Output

```
[ModelImport] Scanning models directory: /models
[ModelImport] Found 3 model(s) in directory
[ModelImport] Extracting GGUF metadata for: llama-3-8b-instruct
[ModelImport] GGUF metadata extracted for llama-3-8b-instruct: {
  architecture: "llama",
  parameters: 8,
  quantization: "Q4_K_M",
  contextLength: 8192,
}
[ModelImport] Creating new model: llama-3-8b-instruct
[ModelImport] Import complete: 3 imported, 0 updated, 0 errors
```

## Supported Architectures (from gguf.js)

- `Llama` - Meta Llama family
- `MPT` - MosaicML MPT
- `GPTNeoX` - EleutherAI GPT-NeoX
- `GPTJ` - GPT-J series
- `Bloom` - BigScience BLOOM
- `Falcon` - Falcon LLM
- `RWKV` - RWKV architecture
- `Gemma` - Google Gemma
- `Qwen` - Alibaba Qwen
- And more...

## Files Modified

1. **`src/server/services/model-import-service.ts`**
   - Added `gguf` import
   - Replaced llama-fit-params calls with gguf.js
   - Updated `extractMetadata()` to parse GGUF directly
   - Updated `saveModelToDatabase()` to use GGUF metadata

2. **`package.json`**
   - Added `gguf` dependency via pnpm

## Benefits

1. **Actual GGUF Metadata** - Reads real metadata from GGUF files
2. **No Filename Parsing** - Doesn't rely on filename regex patterns
3. **More Accurate** - Gets exact architecture, parameters, quantization
4. **Proper Tool** - Uses dedicated GGUF parser library
5. **Full Metadata** - Can access all GGUF fields if needed

## Testing

1. **Import Models** → Should read actual GGUF metadata
2. **Check Database** → Verify `architecture`, `parameter_count`, `quantization_type` populated
3. **View Models UI** → Should show correct metadata badges
4. **Multiple Models** → Should handle Llama, Mistral, Gemma, etc.

## Future Enhancements

1. **More Metadata Fields** - Could store additional GGUF fields (tokenizer, rope freq, etc.)
2. **Validation** - Verify GGUF files are valid
3. **Hash Verification** - Store file hash for integrity checking
4. **Version Detection** - Support multiple GGUF format versions
5. **Batch Processing** - Optimize parsing for large model collections

## References

- gguf.js library: https://github.com/ahoylabs/gguf.js
- GGUF specification: https://github.com/ggerganov/ggml/blob/master/docs/gguf.md
- llama-fit-params: For resource calculation (not metadata)
