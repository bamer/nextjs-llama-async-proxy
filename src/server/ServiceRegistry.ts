type ServiceMap = Map<string, unknown>;

export class ServiceRegistry {
  private static instance: ServiceRegistry | null = null;
  private services: ServiceMap = new Map();

  private constructor() {}

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T | null {
    const service = this.services.get(name);
    return service !== undefined ? (service as T) : null;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  unregister(name: string): boolean {
    return this.services.delete(name);
  }

  clear(): void {
    this.services.clear();
  }
}

export const registry = ServiceRegistry.getInstance();
