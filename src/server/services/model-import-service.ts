import { getLogger } from "@/lib/logger";
import { ModelDownloader, DiscoveredModel } from "./model-downloader";
import { ModelValidator, ModelWithMetadata } from "./model-validator";
import { ModelInstaller } from "./model-installer";
import { getModelByName } from "@/lib/database/models-service";

const logger = getLogger();

export class ModelImportService {
  private downloader: ModelDownloader;
  private validator: ModelValidator;
  private installer: ModelInstaller;

  constructor() {
    this.downloader = new ModelDownloader();
    this.validator = new ModelValidator();
    this.installer = new ModelInstaller();
  }

  public getModelsDirectory(): string | null {
    return this.downloader.getModelsDirectory();
  }

  public async scanModelsDirectory(): Promise<DiscoveredModel[]> {
    return this.downloader.scanModelsDirectory();
  }

  public async extractMetadata(model: DiscoveredModel): Promise<ModelWithMetadata> {
    return this.validator.extractMetadata(model);
  }

  public async saveModelToDatabase(model: ModelWithMetadata): Promise<number | null> {
    return this.installer.saveModelToDatabase(model);
  }

  public async importModels(): Promise<{ imported: number; updated: number; errors: number }> {
    const discoveredModels = await this.scanModelsDirectory();

    if (discoveredModels.length === 0) {
      logger.info("[ModelImport] No models found to import");
      return { imported: 0, updated: 0, errors: 0 };
    }

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const model of discoveredModels) {
      try {
        const modelWithMetadata = await this.extractMetadata(model);
        const existing = getModelByName(model.name);
        const modelId = await this.saveModelToDatabase(modelWithMetadata);

        if (modelId) {
          if (existing) {
            updated++;
          } else {
            imported++;
          }
        }
      } catch (error) {
        errors++;
        logger.error(`[ModelImport] Failed to process model ${model.name}:`, error);
      }
    }

    logger.info(`[ModelImport] Import complete: ${imported} imported, ${updated} updated, ${errors} errors`);

    return { imported, updated, errors };
  }
}
