# Form Components

Comprehensive guide for form-related components.

## Table of Contents

- [SamplingForm](#samplingform)
- [MemoryForm](#memoryform)
- [GPUForm](#gpuform)
- [AdvancedForm](#advancedform)
- [LoRAForm](#loraform)

---

## SamplingForm

### Purpose
Form for configuring model sampling parameters (temperature, top_p, top_k, etc.).

### Props

```typescript
interface SamplingFormProps {
  values: SamplingConfig;
  onChange: (name: string, value: number | string | boolean) => void;
  errors?: Partial<Record<keyof SamplingConfig, string>>;
  disabled?: boolean;
}
```

### Sampling Config

```typescript
interface SamplingConfig {
  temperature: number;       // 0-2, default: 0.7
  top_p: number;            // 0-1, default: 0.9
  top_k: number;            // 1-100, default: 40
  min_p: number;            // 0-1, default: 0.05
  presence_penalty: number;   // -2-2, default: 0
  frequency_penalty: number;  // -2-2, default: 0
  repeat_penalty: number;     // 0-2, default: 1.1
  repeat_last_n: number;     // 0-4096, default: 64
  n_predict: number;         // -1-4096, default: -1
  seed: number;             // 0-4294967295, default: -1
}
```

### Usage

```typescript
import { SamplingForm } from "@/components/forms";

function Example() {
  const [sampling, setSampling] = useState({
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    // ... other fields
  });

  const handleChange = (name: string, value: number | string | boolean) => {
    setSampling((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <SamplingForm
      values={sampling}
      onChange={handleChange}
      disabled={isLoading}
    />
  );
}
```

### Fields

| Field | Range | Default | Description |
|-------|-------|---------|-------------|
| temperature | 0-2 | 0.7 | Randomness in generation |
| top_p | 0-1 | 0.9 | Nucleus sampling threshold |
| top_k | 1-100 | 40 | Top-k sampling limit |
| min_p | 0-1 | 0.05 | Minimum probability |
| presence_penalty | -2-2 | 0 | Reduce repetition of presence |
| frequency_penalty | -2-2 | 0 | Reduce repetition of frequency |
| repeat_penalty | 0-2 | 1.1 | Repetition penalty |
| repeat_last_n | 0-4096 | 64 | Tokens to apply penalty |
| n_predict | -1-4096 | -1 | Max tokens to generate |
| seed | 0-4294967295 | -1 | Random seed (-1 = random) |

### Dependencies
- FormField
- SliderField
- FormSwitch
- FormSection

---

## MemoryForm

### Purpose
Form for configuring memory parameters (context size, batch size, etc.).

### Props

```typescript
interface MemoryFormProps {
  values: MemoryConfig;
  onChange: (name: string, value: number | string | boolean) => void;
  errors?: Partial<Record<keyof MemoryConfig, string>>;
  disabled?: boolean;
}
```

### Memory Config

```typescript
interface MemoryConfig {
  ctx_size: number;        // Context window size, default: 2048
  batch_size: number;      // Batch processing size, default: 512
  n_ctx: number;          // Alternative context size
  n_batch: number;        // Alternative batch size
  memory_f16: boolean;     // Use float16, default: true
  memory_lock: boolean;    // Lock memory, default: false
}
```

### Usage

```typescript
import { MemoryForm } from "@/components/forms";

function Example() {
  const [memory, setMemory] = useState({
    ctx_size: 2048,
    batch_size: 512,
    memory_f16: true,
    memory_lock: false,
  });

  const handleChange = (name: string, value: number | string | boolean) => {
    setMemory((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <MemoryForm
      values={memory}
      onChange={handleChange}
      disabled={isLoading}
    />
  );
}
```

### Fields

| Field | Range/Type | Default | Description |
|-------|-----------|---------|-------------|
| ctx_size | 512-8192 | 2048 | Context window size in tokens |
| batch_size | 1-1024 | 512 | Batch processing size |
| n_ctx | 512-8192 | 2048 | Alternative context size |
| n_batch | 1-1024 | 512 | Alternative batch size |
| memory_f16 | boolean | true | Use float16 for memory |
| memory_lock | boolean | false | Lock memory in RAM |

### Recommendations
- **ctx_size**: Larger values require more RAM
- **batch_size**: Higher values improve throughput but increase latency
- **memory_f16**: Reduces memory usage by ~50%

### Dependencies
- FormField
- FormSwitch
- FormSection

---

## GPUForm

### Purpose
Form for configuring GPU acceleration settings.

### Props

```typescript
interface GPUFormProps {
  values: GPUConfig;
  onChange: (name: string, value: number | string | boolean) => void;
  errors?: Partial<Record<keyof GPUConfig, string>>;
  disabled?: boolean;
}
```

### GPU Config

```typescript
interface GPUConfig {
  n_gpu_layers: number;        // GPU layers, default: -1 (all)
  split_mode: string;          // Mode: layer/row, default: "layer"
  main_gpu: number;           // Main GPU index, default: 0
  tensor_split: string;        // Tensor split, default: ""
  numa: boolean;              // NUMA policy, default: false
  mul_mat_q: boolean;         // Matrix quantization, default: true
  mul_mat_q_n_blocks: number; // Matrix blocks, default: 8
  flash_attn: boolean;        // Flash attention, default: false
}
```

### Usage

```typescript
import { GPUForm } from "@/components/forms";

function Example() {
  const [gpu, setGpu] = useState({
    n_gpu_layers: -1,
    split_mode: "layer",
    main_gpu: 0,
    tensor_split: "",
    numa: false,
    mul_mat_q: true,
    mul_mat_q_n_blocks: 8,
    flash_attn: false,
  });

  const handleChange = (name: string, value: number | string | boolean) => {
    setGpu((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <GPUForm
      values={gpu}
      onChange={handleChange}
      disabled={isLoading}
    />
  );
}
```

### Fields

| Field | Range/Type | Default | Description |
|-------|-----------|---------|-------------|
| n_gpu_layers | -1-100 | -1 | Layers on GPU (-1 = all, 0 = none) |
| split_mode | string | "layer" | Split mode: "layer" or "row" |
| main_gpu | 0-7 | 0 | Main GPU device index |
| tensor_split | string | "" | Tensor split (e.g., "10,5") |
| numa | boolean | false | Enable NUMA-aware allocation |
| mul_mat_q | boolean | true | Enable matrix quantization |
| mul_mat_q_n_blocks | 1-16 | 8 | Matrix quantization blocks |
| flash_attn | boolean | false | Enable flash attention |

### GPU Split Configuration

Format: "GPU0,GPU1,GPU2" in GiB per GPU
```typescript
// Example: Split 12 GiB model across 3 GPUs
tensor_split: "4,4,4"
```

### Dependencies
- FormField
- FormSwitch
- FormSection
- FormTooltip

---

## AdvancedForm

### Purpose
Form for advanced model configuration options.

### Props

```typescript
interface AdvancedFormProps {
  values: AdvancedConfig;
  onChange: (name: string, value: number | string | boolean) => void;
  errors?: Partial<Record<keyof AdvancedConfig, string>>;
  disabled?: boolean;
}
```

### Advanced Config

```typescript
interface AdvancedConfig {
  n_threads: number;        // CPU threads, default: -1 (auto)
  n_threads_batch: number;   // Batch threads, default: -1
  n_parallel: number;       // Parallel prompts, default: 1
  cont_batching: boolean;   // Continuous batching, default: true
  drafts: number;           // Drafts for speculation, default: 0
  speculative_ngram: boolean; // Speculative ngram, default: false
  cache_type_k: string;     // K cache type, default: "auto"
  cache_type_v: string;     // V cache type, default: "auto"
  cache_type: string;       // Unified cache type, default: "auto"
  rope_freq_base: number;   // RoPE frequency base, default: 10000
  rope_freq_scale: number;  // RoPE frequency scale, default: 1.0
  yarn_ext_factor: number;  // YaRN extension factor, default: -1.0
  yarn_attn_factor: number; // YaRN attention factor, default: 1.0
  yarn_beta_fast: number;   // YaRN beta fast, default: 32.0
  yarn_beta_slow: number;   // YaRN beta slow, default: 1.0
}
```

### Usage

```typescript
import { AdvancedForm } from "@/components/forms";

function Example() {
  const [advanced, setAdvanced] = useState({
    n_threads: -1,
    n_threads_batch: -1,
    n_parallel: 1,
    cont_batching: true,
    drafts: 0,
    speculative_ngram: false,
    cache_type: "auto",
    rope_freq_base: 10000,
    rope_freq_scale: 1.0,
    // ... other fields
  });

  const handleChange = (name: string, value: number | string | boolean) => void => {
    setAdvanced((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <AdvancedForm
      values={advanced}
      onChange={handleChange}
      disabled={isLoading}
    />
  );
}
```

### Fields

| Field | Range/Type | Default | Description |
|-------|-----------|---------|-------------|
| n_threads | -1-16 | -1 | CPU threads (-1 = auto) |
| n_threads_batch | -1-16 | -1 | Batch threads (-1 = auto) |
| n_parallel | 1-8 | 1 | Parallel prompts |
| cont_batching | boolean | true | Continuous batching |
| drafts | 0-5 | 0 | Speculative drafts |
| speculative_ngram | boolean | false | Speculative ngram |
| cache_type_k | string | "auto" | K cache type |
| cache_type_v | string | "auto" | V cache type |
| cache_type | string | "auto" | Unified cache type |
| rope_freq_base | 100-100000 | 10000 | RoPE base frequency |
| rope_freq_scale | 0.1-10.0 | 1.0 | RoPE frequency scale |
| yarn_ext_factor | -1.0-10.0 | -1.0 | YaRN extension |
| yarn_attn_factor | 0.1-10.0 | 1.0 | YaRN attention |
| yarn_beta_fast | 0.1-100.0 | 32.0 | YaRN beta fast |
| yarn_beta_slow | 0.1-10.0 | 1.0 | YaRN beta slow |

### Cache Types
- "auto" - Automatic selection
- "f16" - Float16
- "f32" - Float32
- "q8_0" - 8-bit quantized
- "q4_0" - 4-bit quantized

### Dependencies
- FormField
- FormSwitch
- FormSection
- FormTooltip

---

## LoRAForm

### Purpose
Form for configuring LoRA (Low-Rank Adaptation) adapters.

### Props

```typescript
interface LoRAFormProps {
  values: LoRAConfig;
  onChange: (name: string, value: number | string | boolean | string[]) => void;
  errors?: Partial<Record<keyof LoRAConfig, string>>;
  disabled?: boolean;
}
```

### LoRA Config

```typescript
interface LoRAConfig {
  lora_adapter: string[];   // LoRA adapter paths
  lora_base: string;        // Base model path
  lora_scale: number;       // LoRA scale, default: 1.0
  n_lora: number;          // Number of LoRAs
}
```

### Usage

```typescript
import { LoRAForm } from "@/components/forms";

function Example() {
  const [lora, setLora] = useState({
    lora_adapter: [],
    lora_base: "",
    lora_scale: 1.0,
    n_lora: 0,
  });

  const handleChange = (name: string, value: number | string | boolean | string[]) => {
    setLora((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAdapter = (path: string) => {
    setLora((prev) => ({
      ...prev,
      lora_adapter: [...prev.lora_adapter, path],
    }));
  };

  return (
    <LoRAForm
      values={lora}
      onChange={handleChange}
      onAddAdapter={handleAddAdapter}
      disabled={isLoading}
    />
  );
}
```

### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| lora_adapter | string[] | [] | List of LoRA adapter file paths |
| lora_base | string | "" | Base model path (if different) |
| lora_scale | 0.0-2.0 | 1.0 | LoRA scaling factor |
| n_lora | 0-16 | 0 | Number of LoRA adapters |

### LoRA Scale Guidelines
- **1.0**: Full LoRA effect
- **0.5**: Half strength
- **0.0**: Disabled (no effect)
- **>1.0**: Amplified effect

### Dependencies
- FormField
- FormSection
- FormTooltip
- MultiSelect

---

## Common Patterns

### Form State Management

```typescript
import { useFormState } from "@/hooks";
import { SamplingForm } from "@/components/forms";

function Example() {
  const { values, setValue, errors, isSubmitting } = useFormState({
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
  });

  return (
    <SamplingForm
      values={values}
      onChange={(name, value) => setValue(name, value)}
      errors={errors}
      disabled={isSubmitting}
    />
  );
}
```

### Form Validation

```typescript
const validateSampling = (values: SamplingConfig) => {
  const errors: Partial<Record<keyof SamplingConfig, string>> = {};

  if (values.temperature < 0 || values.temperature > 2) {
    errors.temperature = "Temperature must be between 0 and 2";
  }

  if (values.top_p < 0 || values.top_p > 1) {
    errors.top_p = "Top P must be between 0 and 1";
  }

  return errors;
};

const errors = validateSampling(values);
```

### Form Submission

```typescript
import { useNotification } from "@/hooks";

function Example() {
  const { showNotification } = useNotification();

  const handleSubmit = async () => {
    try {
      await saveConfig(values);
      showNotification("Configuration saved!", "success");
    } catch (error) {
      showNotification("Failed to save configuration", "error");
    }
  };

  return (
    <>
      <SamplingForm values={values} onChange={handleChange} />
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        Save Configuration
      </Button>
    </>
  );
}
```

### Reset Form

```typescript
const { resetForm } = useFormState(initialValues);

const handleReset = () => {
  resetForm();
  showNotification("Form reset to defaults", "info");
};
```

---

## Best Practices

### 1. Use Consistent onChange Pattern

```typescript
// ✅ Good
onChange={(name, value) => setValue(name, value)}

// ❌ Bad
onChange={(e) => setValue(e.target.value)}
```

### 2. Provide Tooltips for Complex Options

```typescript
<FormField
  label="Temperature"
  name="temperature"
  tooltip={{
    title: "Temperature",
    description: "Controls randomness in text generation",
    recommendedValue: "0.7",
    effectOnModel: "Higher values increase creativity",
  }}
/>
```

### 3. Debounce Frequent Updates

```typescript
const [debouncedValue, setDebouncedValue] = useDebouncedState(
  temperature,
  300 // 300ms delay
);
```

### 4. Show Loading States

```typescript
<WithLoading loading={isSubmitting}>
  <SamplingForm values={values} onChange={handleChange} />
</WithLoading>
```

### 5. Handle Errors Gracefully

```typescript
{errors.temperature && (
  <Alert severity="error">
    {errors.temperature}
  </Alert>
)}
```

---

## Form Composition

### Complete Configuration Form

```typescript
import {
  SamplingForm,
  MemoryForm,
  GPUForm,
  AdvancedForm,
  LoRAForm,
} from "@/components/forms";
import { Tabs, Tab, Box } from "@mui/material";

function ConfigurationForm() {
  const [tab, setTab] = useState(0);

  return (
    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
      <Tab label="Sampling" />
      <Tab label="Memory" />
      <Tab label="GPU" />
      <Tab label="Advanced" />
      <Tab label="LoRA" />
    </Tabs>

    {tab === 0 && <SamplingForm values={sampling} onChange={handleChange} />}
    {tab === 1 && <MemoryForm values={memory} onChange={handleChange} />}
    {tab === 2 && <GPUForm values={gpu} onChange={handleChange} />}
    {tab === 3 && <AdvancedForm values={advanced} onChange={handleChange} />}
    {tab === 4 && <LoRAForm values={lora} onChange={handleChange} />}
  </Tabs>
  );
}
```

---

## Dependencies Summary

| Component | UI Components | Hooks |
|-----------|---------------|--------|
| SamplingForm | FormField, SliderField, FormSwitch, FormSection | None |
| MemoryForm | FormField, FormSwitch, FormSection | None |
| GPUForm | FormField, FormSwitch, FormSection, FormTooltip | None |
| AdvancedForm | FormField, FormSwitch, FormSection, FormTooltip | None |
| LoRAForm | FormField, FormSection, FormTooltip, MultiSelect | None |

---

## See Also

- [UI Components](../ui/README.md)
- [Dashboard Components](../dashboard/README.md)
- [Custom Hooks](../../hooks/README.md)
- [Component Library Overview](../README.md)
