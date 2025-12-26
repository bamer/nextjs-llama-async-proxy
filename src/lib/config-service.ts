import { z } from 'zod';
// import { APP_CONFIG } from '@/config/app.config';

// Configuration Schema with Zod validation
export const ConfigSchema = z.object({
  // General settings
  basePath: z.string().min(1, "Base path is required"),
  logLevel: z.enum(["debug", "info", "warn", "error"]),
  maxConcurrentModels: z.number().min(1).max(20),
  autoUpdate: z.boolean(),
  notificationsEnabled: z.boolean(),

  // Llama server path
  llamaServerPath: z.string().default("/home/bamer/llama.cpp/build/bin/llama-server"),

  // Legacy model defaults (for compatibility)
  modelDefaults: z.object({
    ctx_size: z.number().min(128).max(2000000),
    batch_size: z.number().min(1),
    temperature: z.number().min(0).max(2),
    top_p: z.number().min(0).max(1),
    top_k: z.number().min(0),
    gpu_layers: z.number().int(),
    threads: z.number().int(),
  }),

  // Complete llama-server configuration
  llamaServer: z.object({
    // Server options
    host: z.string().default("127.0.0.1"),
    port: z.number().min(1).max(65535).default(8080),
    timeout: z.number().min(1000).default(30000),

    // Basic options
    ctx_size: z.number().min(128).max(2000000).default(4096),
    batch_size: z.number().min(1).default(2048),
    ubatch_size: z.number().min(1).default(512),
    threads: z.number().int().default(-1),
    threads_batch: z.number().int().default(-1),
    n_predict: z.number().int().default(-1),
    seed: z.number().int().default(-1),

    // GPU options
    gpu_layers: z.number().int().default(-1),
    n_cpu_moe: z.number().int().default(0),
    cpu_moe: z.boolean().default(false),
    main_gpu: z.number().int().default(0),
    tensor_split: z.string().optional(),
    split_mode: z.enum(["none", "layer", "row"]).default("layer"),
    device: z.string().optional(),
    no_mmap: z.boolean().default(false),
    mlock: z.boolean().default(false),

    // Performance options
    parallel: z.number().min(1).default(1),
    flash_attn: z.enum(["on", "off", "auto"]).default("auto"),
    kv_unified: z.boolean().default(false),
    cont_batching: z.boolean().default(true),
    cache_reuse: z.number().int().default(0),
    no_warmup: z.boolean().default(false),

    // Sampling options
    temperature: z.number().min(0).max(2).default(0.8),
    top_k: z.number().min(0).default(40),
    top_p: z.number().min(0).max(1).default(0.9),
    min_p: z.number().min(0).max(1).default(0.1),
    repeat_penalty: z.number().min(0).max(2).default(1.0),
    repeat_last_n: z.number().min(0).default(64),
    mirostat: z.number().min(0).max(2).default(0),
    mirostat_lr: z.number().min(0).max(1).default(0.1),
    mirostat_ent: z.number().min(0).max(10).default(5.0),

    // Advanced options
    rope_scaling: z.enum(["none", "linear", "yarn"]).optional(),
    rope_scale: z.number().min(1).max(4).default(1.0),
    rope_freq_base: z.number().optional(),
    no_kv_offload: z.boolean().default(false),
    cache_type_k: z.enum(["f32", "f16", "bf16", "q8_0", "q4_0", "q4_1"]).default("f16"),
    cache_type_v: z.enum(["f32", "f16", "bf16", "q8_0", "q4_0", "q4_1"]).default("f16"),
    numa: z.enum(["distribute", "isolate", "numactl"]).optional(),

    // Logging options
    verbose: z.boolean().default(false),
    log_colors: z.enum(["on", "off", "auto"]).default("auto"),
    log_timestamps: z.boolean().default(false),
    no_perf: z.boolean().default(false),

    // Special options
    jinja: z.boolean().default(true),
    metrics: z.boolean().default(false),
    no_webui: z.boolean().default(false),
    embedding: z.boolean().default(false),
  }).optional(),
});

export type ConfigType = z.infer<typeof ConfigSchema>;

// Default configuration
export const DEFAULT_CONFIG: ConfigType = {
  basePath: "/home/user/models",
  logLevel: "info",
  maxConcurrentModels: 5,
  autoUpdate: true,
  notificationsEnabled: true,
  llamaServerPath: "/home/bamer/llama.cpp/build/bin/llama-server",
  modelDefaults: {
    ctx_size: 4096,
    batch_size: 2048,
    temperature: 0.8,
    top_p: 0.9,
    top_k: 40,
    gpu_layers: -1,
    threads: -1,
  },
  llamaServer: {
    // Server options
    host: "127.0.0.1",
    port: 8080,
    timeout: 30000,

    // Basic options
    ctx_size: 4096,
    batch_size: 2048,
    ubatch_size: 512,
    threads: -1,
    threads_batch: -1,
    n_predict: -1,
    seed: -1,

    // GPU options
    gpu_layers: -1,
    n_cpu_moe: 0,
    cpu_moe: false,
    main_gpu: 0,
    split_mode: "layer",
    no_mmap: false,
    mlock: false,

    // Performance options
    parallel: 1,
    flash_attn: "auto",
    kv_unified: false,
    cont_batching: true,
    cache_reuse: 0,
    no_warmup: false,

    // Sampling options
    temperature: 0.8,
    top_k: 40,
    top_p: 0.9,
    min_p: 0.1,
    repeat_penalty: 1.0,
    repeat_last_n: 64,
    mirostat: 0,
    mirostat_lr: 0.1,
    mirostat_ent: 5.0,

    // Advanced options
    rope_scale: 1.0,
    no_kv_offload: false,
    cache_type_k: "f16",
    cache_type_v: "f16",

    // Logging options
    verbose: false,
    log_colors: "auto",
    log_timestamps: false,
    no_perf: false,

    // Special options
    jinja: true,
    metrics: false,
    no_webui: false,
    embedding: false,
  },
};

class ConfigService {
  private config: ConfigType;
  private readonly storageKey = "app-config-v2";

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedConfig = localStorage.getItem(this.storageKey);
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          const validated = ConfigSchema.safeParse(parsed);
          
          if (validated.success) {
            this.config = validated.data;
            console.log("Config loaded successfully");
          } else {
            console.error("Invalid config, using defaults:", validated.error);
            this.config = { ...DEFAULT_CONFIG };
          }
        }
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  public getConfig(): ConfigType {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<ConfigType>): void {
    try {
      const newConfig = { ...this.config, ...updates };
      const validated = ConfigSchema.safeParse(newConfig);
      
      if (validated.success) {
        this.config = validated.data;
        this.saveConfig();
        console.log("Config updated successfully");
      } else {
        console.error("Invalid config update:", validated.error);
        throw new Error("Invalid configuration");
      }
    } catch (error) {
      console.error("Failed to update config:", error);
      throw error;
    }
  }

  private saveConfig(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.config));
      }
    } catch (error) {
      console.error("Failed to save config:", error);
      throw error;
    }
  }

  public resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
    console.log("Config reset to defaults");
  }

  public async syncWithBackend(): Promise<void> {
    try {
      // In a real implementation, this would sync with your backend API
      // For now, we'll just simulate a successful sync
      console.log("Syncing config with backend...");
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("Config synced successfully");
    } catch (error) {
      console.error("Failed to sync config with backend:", error);
      throw error;
    }
  }

  public validateConfig(config: any): { valid: boolean; errors?: string[] } {
    const result = ConfigSchema.safeParse(config);
    
    if (result.success) {
      return { valid: true };
    } else {
      const zodError = result.error as any;
      const errors = zodError?.errors?.map((err: any) => 
        `${err.path.join('.')} - ${err.message}`
      ) || [`Validation failed: ${zodError?.message || 'Unknown error'}`];
      return { valid: false, errors };
    }
  }
}

export const configService = new ConfigService();
