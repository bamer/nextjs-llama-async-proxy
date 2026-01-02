import fs from "fs";
import path from "path";
import { getLogger } from "@/lib/logger";
import { getServerConfig } from "@/lib/database";
import { loadConfig } from "@/lib/server-config";
import { DiscoveredModel } from "./model-import-service";

const logger = getLogger();

export class ModelDirectoryService {
  private modelsDir: string | null = null;

  constructor() {
    this.loadModelsDirectory();
  }

  private loadModelsDirectory(): void {
    try {
      const serverConfig = getServerConfig();
      if (serverConfig?.models_dir) {
        this.modelsDir = serverConfig.models_dir;
        logger.info(`[ModelDirectory] Models directory from database: ${this.modelsDir}`);
        return;
      }

      const fileConfig = loadConfig();
      if (fileConfig?.basePath) {
        this.modelsDir = fileConfig.basePath;
        logger.info(`[ModelDirectory] Models directory from config file: ${this.modelsDir}`);
        return;
      }

      this.modelsDir = null;
      logger.warn("[ModelDirectory] No models directory configured");
    } catch (error) {
      logger.warn("[ModelDirectory] Failed to load models directory from config:", error);
      this.modelsDir = null;
    }
  }

  public getModelsDirectory(): string | null {
    return this.modelsDir;
  }

  public async scanModelsDirectory(): Promise<DiscoveredModel[]> {
    if (!this.modelsDir) {
      logger.warn("[ModelDirectory] No models directory configured");
      return [];
    }

    if (!fs.existsSync(this.modelsDir)) {
      logger.warn(`[ModelDirectory] Models directory not found: ${this.modelsDir}`);
      return [];
    }

    logger.info(`[ModelDirectory] Scanning models directory: ${this.modelsDir}`);

    const models: DiscoveredModel[] = [];

    try {
      const entries = fs.readdirSync(this.modelsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(this.modelsDir, entry.name);
          const dirFiles = fs.readdirSync(dirPath);

          for (const file of dirFiles) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile() && (file.endsWith(".gguf") || file.endsWith(".bin"))) {
              models.push({
                name: entry.name,
                path: filePath,
                size: stat.size,
                modified_at: Math.floor(stat.mtimeMs / 1000),
                type: file.endsWith(".gguf") ? "gguf" : "bin",
              });
              break;
            }
          }
        } else if (entry.isFile() && (entry.name.endsWith(".gguf") || entry.name.endsWith(".bin"))) {
          const filePath = path.join(this.modelsDir, entry.name);
          const stat = fs.statSync(filePath);
          models.push({
            name: entry.name.replace(/\.(gguf|bin)$/i, ""),
            path: filePath,
            size: stat.size,
            modified_at: Math.floor(stat.mtimeMs / 1000),
            type: entry.name.endsWith(".gguf") ? "gguf" : "bin",
          });
        }
      }

      logger.info(`[ModelDirectory] Found ${models.length} model(s) in directory`);
      return models;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[ModelDirectory] Failed to scan models directory: ${message}`);
      return [];
    }
  }
}