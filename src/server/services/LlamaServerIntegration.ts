import type { Server, Socket } from "socket.io";
import type { LlamaService, LlamaServerConfig } from "./llama/LlamaService";
import { ServerCore } from "./ServerCore";
import { ModelImportService } from "./model-import-service";

export class LlamaServerIntegration {
  private core: ServerCore;

  constructor(io: Server) {
    this.core = new ServerCore(io);
  }

  async initialize(config: LlamaServerConfig): Promise<void> {
    await this.core.initialize(config);
  }

  public setupWebSocketHandlers(socket: Socket): Promise<void> {
    return this.core.setupWebSocketHandlers(socket, new ModelImportService());
  }

  async stop(): Promise<void> {
    await this.core.stop();
  }

  public getLlamaService(): LlamaService | null {
    return this.core.getLlamaService();
  }
}

export default LlamaServerIntegration;
