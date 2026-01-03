import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { APP_CONFIG } from "@/config/app.config";
import type { ApiResponse } from "@/types";

class ApiClient {
  private _instance: AxiosInstance | null = null;
  private readonly baseConfig: AxiosRequestConfig;

  constructor() {
    this.baseConfig = {
      baseURL: APP_CONFIG.api.baseUrl,
      timeout: APP_CONFIG.api.timeout,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    };
  }

  private getInstance(): AxiosInstance {
    if (!this._instance) {
      this._instance = axios.create(this.baseConfig);
      this.initializeInterceptors();
    }
    return this._instance;
  }

  // For testing: Reset the instance to allow mocking
  public resetInstance(): void {
    this._instance = null;
  }

  private initializeInterceptors(): void {
    if (!this._instance) return;

    // Request interceptor
    this._instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        // const token = getAuthToken();
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this._instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data;
      },
      (error: AxiosError) => {
        if (error.response) {
          // Handle specific error statuses
          switch (error.response.status) {
            case 401:
              // Handle unauthorized
              break;
            case 403:
              // Handle forbidden
              break;
            case 404:
              // Handle not found
              break;
            case 500:
              // Handle server error
              break;
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: AxiosError): ApiResponse<never> {
    if (error.response) {
      return {
        success: false,
        error: {
          code: error.response.status.toString(),
          message: error.response.statusText,
          details: error.response.data,
        },
        timestamp: new Date().toISOString(),
      };
    } else if (error.request) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Network error",
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: error.message,
          details: error.stack,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().get<T>(url, config);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().post<T>(url, data, config);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().put<T>(url, data, config);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().delete<T>(url, config);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().patch<T>(url, data, config);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }
}

export { ApiClient };
export const apiClient = new ApiClient();