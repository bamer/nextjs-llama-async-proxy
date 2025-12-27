import axios, { AxiosInstance } from "axios";
import fs from "fs";
import path from "path";
import { LlamaModel } from "./types";

export class ModelLoader {
  private client: AxiosInstance;
  private basePath: string | undefined;

  constructor(host: string, port: number, basePath?: string) {
    this.basePath = basePath;
    this.client = axios.create({
      baseURL: `http://${host}:${port}`,
      timeout: 5000,
      validateStatus: () => true,
    });
  }

  async loadFromServer(): Promise<LlamaModel[]> {
    try {
      const response = await this.client.get("/models");

      if (response.status === 200 && response.data) {
        const modelsData = Array.isArray(response.data)
          ? response.data
          : response.data.data || response.data;

        if (Array.isArray(modelsData) && modelsData.length > 0) {
          return modelsData.map((model) => ({
            id: model.id || model.name,
            name: model.id || model.name,
            path: (model as any).path,
            size: model.size || 0,
            type: model.type || "unknown",
            modified_at: Math.floor(Date.now() / 1000),
          }));
        }
      }

      return [];
    } catch {
      throw new Error("Failed to fetch models from server");
    }
  }

  loadFromFilesystem(): LlamaModel[] {
    if (!this.basePath) {
      return [];
    }

    if (!fs.existsSync(this.basePath)) {
      return [];
    }

    try {
      const files = fs.readdirSync(this.basePath, "utf8");
      const modelFiles = files.filter(
        (file) => file.endsWith(".gguf") || file.endsWith(".bin")
      );

      return modelFiles.map((file) => {
        const fullPath = path.join(this.basePath || "", file);
        const stats = fs.statSync(fullPath);
        return {
          id: file,
          name: file.replace(/\.(gguf|bin)$/i, ""),
          size: stats.size,
          type: file.endsWith(".gguf") ? "gguf" : "bin",
          modified_at: Math.floor(stats.mtimeMs / 1000),
        };
      });
    } catch {
      return [];
    }
  }

  async load(): Promise<LlamaModel[]> {
    try {
      return await this.loadFromServer();
    } catch {
      // Fallback to filesystem
      return this.loadFromFilesystem();
    }
  }
}
