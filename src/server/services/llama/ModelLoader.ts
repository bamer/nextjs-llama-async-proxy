import fs from "fs";
import path from "path";
import { getLogger } from "@/lib/logger";
import type { LlamaModel } from "./types";

const logger = getLogger();

export class ModelLoader {
  private basePath: string | undefined;
  private loadModelsFn: () => Promise<LlamaModel[]>;

  constructor(basePath: string | undefined, loadModelsFn: () => Promise<LlamaModel[]>) {
    if (basePath !== undefined) {
      this.basePath = basePath;
    }
    this.loadModelsFn = loadModelsFn;
  }

  /**
   * Load available models from llama-server
   * Uses the /models endpoint (not /api/models)
   */
  async loadModels(): Promise<LlamaModel[]> {
    try {
      logger.info("🔍 Querying llama-server for available models...");

      const models = await this.loadModelsFn();

      if (models.length > 0) {
        logger.info(`✅ Loaded ${models.length} model(s) from llama-server`);

        models.forEach((model) => {
          const sizeGb =
            (model.size !== undefined && model.size > 0)
              ? (model.size / 1024 / 1024 / 1024).toFixed(2)
              : "unknown";
          logger.info(`  - ${model.name} (${sizeGb} GB)`);
        });

        return models;
      } else {
        logger.warn(
          "⚠️ No models found on server. Check --models-dir configuration."
        );
      }

      // Fallback: scan filesystem
      return this.loadModelsFromFilesystem();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to load models from server: ${message}`);
      // Fallback: scan filesystem
      return this.loadModelsFromFilesystem();
    }
  }

  /**
   * Load models by scanning filesystem (with template detection)
   * Scans models directory for subdirectories containing .gguf or .bin files
   * Detects .jinja template files and includes built-in templates
   */
  private loadModelsFromFilesystem(): LlamaModel[] {
    try {
      if (!this.basePath) {
        logger.warn("⚠️ No basePath configured. Cannot discover models.");
        return [];
      }

      logger.info(
        `📂 Fallback: Scanning filesystem for models in: ${this.basePath}`
      );

      if (!fs.existsSync(this.basePath)) {
        logger.warn(`⚠️ Models directory not found: ${this.basePath}`);
        return [];
      }

      // Built-in templates supported by llama.cpp
      const builtinTemplates = [
        "chatml",
        "alpaca",
        "vicuna",
        "llama-2",
        "llama-3",
        "chatml-falcon",
        "zephyr",
      ];

      const files = fs.readdirSync(this.basePath);
      const models: Array<{
        name: string;
        path: string;
        size: number;
        modified_at: number;
      }> = [];

      // Scan for subdirectories containing model files
      files.forEach((file) => {
        const fullPath = path.join(this.basePath || "", file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          const dirFiles = fs.readdirSync(fullPath);
          const ggufFile = dirFiles.find(
            (f) => f.endsWith(".gguf") || f.endsWith(".bin")
          );

          if (ggufFile) {
            models.push({
              name: file,
              path: path.join(fullPath, ggufFile),
              size: fs.statSync(path.join(fullPath, ggufFile)).size,
              modified_at: Math.floor(stats.mtimeMs / 1000),
            });
          }
        }
      });

      // Build model objects with template detection
      const result = models.map((model) => {
        const modelName = model.name;
        const availableTemplates = [...builtinTemplates];
        let matchingTemplate: string | undefined;

        const modelDirPath = path.join(this.basePath || "", modelName);

        if (fs.existsSync(modelDirPath)) {
          const dirFiles = fs.readdirSync(modelDirPath);

          // Scan for .jinja template files
          dirFiles.forEach((file) => {
            if (file.toLowerCase().endsWith(".jinja")) {
              const templateName = file.replace(/\.jinja$/i, "");
              if (!availableTemplates.includes(templateName)) {
                availableTemplates.push(templateName);
              }
            }
          });

          // Find matching template (first one that has a .jinja file)
          matchingTemplate = availableTemplates.find((t) => {
            const templateFile = `${t}.jinja`;
            return fs.existsSync(path.join(modelDirPath, templateFile));
          });
        }

        const resultModel: LlamaModel = {
          id: modelName,
          name: modelName,
          path: model.path,
          size: model.size,
          type: model.path.endsWith(".gguf") ? "gguf" : "bin",
          modified_at: model.modified_at,
          ...(availableTemplates.length > 0 && { availableTemplates }),
          ...(matchingTemplate && { template: matchingTemplate }),
        };

        return resultModel;
      });

      logger.info(`✅ Loaded ${result.length} model(s) from filesystem`);

      // Log each model with template count
      result.forEach((model) => {
        const sizeGb =
          model.size !== undefined
            ? (model.size / 1024 / 1024 / 1024).toFixed(2)
            : "unknown";
        const templateInfo = model.availableTemplates
          ? ` with ${model.availableTemplates.length} template(s)`
          : "";
        logger.info(`  - ${model.name} (${sizeGb} GB)${templateInfo}`);
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to load models from filesystem: ${message}`);
      return [];
    }
  }
}
