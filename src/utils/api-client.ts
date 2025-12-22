import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { APP_CONFIG } from "@config/app.config";

class ApiClient {
  private instance: AxiosInstance;
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

    this.instance = axios.create(this.baseConfig);

    this.initializeInterceptors();
  }

  private initializeInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
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
    this.instance.interceptors.response.use(
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

  private formatError(error: AxiosError): ApiResponse {
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

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.get<T>(url, config);
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post<T>(url, data, config);
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.put<T>(url, data, config);
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.delete<T>(url, config);
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.patch<T>(url, data, config);
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }
}

export const apiClient = new ApiClient();