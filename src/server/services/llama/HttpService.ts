import type { AxiosInstance } from "axios";
import axios from "axios";
import { getLogger } from "@/lib/logger";
import type { LlamaModel } from "./types";

const logger = getLogger();

export class HttpService {
  private client: AxiosInstance;

  constructor(host: string, port: number, timeoutMs: number = 5000) {
    this.client = axios.create({
      baseURL: `http://${host}:${port}`,
      timeout: timeoutMs,
      validateStatus: () => true,
    });
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get models from server
   */
  async getModels(): Promise<LlamaModel[]> {
    try {
      const response = await this.client.get("/models");

      if (response.status === 200 && response.data) {
        // Handle both array and object with data property
        const modelsData = Array.isArray(response.data)
          ? response.data
          : response.data.data || response.data;

        if (Array.isArray(modelsData)) {
          return modelsData as LlamaModel[];
        }
      }

      return [];
    } catch (error) {
      logger.error(`Failed to fetch models: ${error}`);
      return [];
    }
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string): Promise<T | null> {
    try {
      const response = await this.client.get<T>(path);
      return response.data;
    } catch (error) {
      logger.error(`GET ${path} failed: ${error}`);
      return null;
    }
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, data: unknown): Promise<T | null> {
    try {
      const response = await this.client.post<T>(path, data);
      return response.data;
    } catch (error) {
      logger.error(`POST ${path} failed: ${error}`);
      return null;
    }
  }

  /**
   * Update base URL
   */
  updateBaseURL(host: string, port: number): void {
    this.client.defaults.baseURL = `http://${host}:${port}`;
  }

  /**
   * Update timeout
   */
  updateTimeout(timeoutMs: number): void {
    this.client.defaults.timeout = timeoutMs;
  }

  /**
   * Get the underlying axios instance
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}
