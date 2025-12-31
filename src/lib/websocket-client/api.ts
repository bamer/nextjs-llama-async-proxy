/**
 * WebSocket API methods
 * Provides high-level methods for common WebSocket operations
 */

import { MessageHandler } from './message-handler';

export class WebSocketAPI {
  constructor(private messageHandler: MessageHandler) {}

  /**
   * Request current metrics from server
   */
  requestMetrics(): void {
    this.messageHandler.sendMessage('request_metrics', {});
  }

  /**
   * Request logs from server
   */
  requestLogs(): void {
    this.messageHandler.sendMessage('request_logs', {});
  }

  /**
   * Request models from server
   */
  requestModels(): void {
    this.messageHandler.sendMessage('request_models', {});
  }

  /**
   * Request Llama server status
   */
  requestLlamaStatus(): void {
    this.messageHandler.sendMessage('requestLlamaStatus');
  }

  /**
   * Rescan for available models
   */
  rescanModels(): void {
    this.messageHandler.sendMessage('rescanModels');
  }

  /**
   * Start a model
   */
  startModel(modelId: string): void {
    this.messageHandler.sendMessage('startModel', { modelId });
  }

  /**
   * Stop a model
   */
  stopModel(modelId: string): void {
    this.messageHandler.sendMessage('stopModel', { modelId });
  }
}
