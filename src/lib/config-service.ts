import { z } from 'zod';
// import { APP_CONFIG } from '@/config/app.config';

// Configuration Schema with Zod validation
export const ConfigSchema = z.object({
  basePath: z.string().min(1, "Base path is required"),
  logLevel: z.enum(["debug", "info", "warn", "error"]),
  maxConcurrentModels: z.number().min(1).max(20),
  autoUpdate: z.boolean(),
  notificationsEnabled: z.boolean(),
  modelDefaults: z.object({
    ctx_size: z.number().min(128).max(2000000),
    batch_size: z.number().min(1),
    temperature: z.number().min(0).max(2),
    top_p: z.number().min(0).max(1),
    top_k: z.number().min(0),
    gpu_layers: z.number().int(),
    threads: z.number().int(),
  }),
});

export type ConfigType = z.infer<typeof ConfigSchema>;

// Default configuration
export const DEFAULT_CONFIG: ConfigType = {
  basePath: "/home/user/models",
  logLevel: "info",
  maxConcurrentModels: 5,
  autoUpdate: true,
  notificationsEnabled: true,
  modelDefaults: {
    ctx_size: 4096,
    batch_size: 2048,
    temperature: 0.8,
    top_p: 0.9,
    top_k: 40,
    gpu_layers: -1,
    threads: -1,
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
