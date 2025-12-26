import { ServiceRegistry, registry } from '@/server/ServiceRegistry';

describe('ServiceRegistry', () => {
  let serviceRegistry: ServiceRegistry;

  beforeEach(() => {
    serviceRegistry = ServiceRegistry.getInstance();
    serviceRegistry.clear();
  });

  afterEach(() => {
    serviceRegistry.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance across multiple getInstance calls', () => {
      const instance1 = ServiceRegistry.getInstance();
      const instance2 = ServiceRegistry.getInstance();
      const instance3 = ServiceRegistry.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });

    it('should have private constructor', () => {
      expect(() => {
        new (ServiceRegistry as any)();
      }).toThrow();
    });

    it('should export singleton instance', () => {
      expect(registry).toBeInstanceOf(ServiceRegistry);
    });

    it('should return same instance as exported registry', () => {
      const instance = ServiceRegistry.getInstance();

      expect(registry).toBe(instance);
    });
  });

  describe('register', () => {
    it('should register a service with a name', () => {
      const mockService = { name: 'test-service' };

      serviceRegistry.register('testService', mockService);

      const retrieved = serviceRegistry.get('testService');
      expect(retrieved).toEqual(mockService);
    });

    it('should register multiple services', () => {
      const service1 = { id: 1 };
      const service2 = { id: 2 };
      const service3 = { id: 3 };

      serviceRegistry.register('service1', service1);
      serviceRegistry.register('service2', service2);
      serviceRegistry.register('service3', service3);

      expect(serviceRegistry.get('service1')).toEqual(service1);
      expect(serviceRegistry.get('service2')).toEqual(service2);
      expect(serviceRegistry.get('service3')).toEqual(service3);
    });

    it('should overwrite existing service with same name', () => {
      const service1 = { version: 1 };
      const service2 = { version: 2 };

      serviceRegistry.register('myService', service1);
      serviceRegistry.register('myService', service2);

      const retrieved = serviceRegistry.get('myService');
      expect(retrieved).toEqual(service2);
    });

    it('should support registering null/undefined services', () => {
      serviceRegistry.register('nullService', null);
      serviceRegistry.register('undefinedService', undefined);

      expect(serviceRegistry.get('nullService')).toBeNull();
      expect(serviceRegistry.get('undefinedService')).toBeNull();
    });

    it('should support different service types', () => {
      const stringService = 'service-as-string';
      const numberService = 42;
      const objectService = { method: () => {} };
      const functionService = () => {};

      serviceRegistry.register('string', stringService);
      serviceRegistry.register('number', numberService);
      serviceRegistry.register('object', objectService);
      serviceRegistry.register('function', functionService);

      expect(serviceRegistry.get('string')).toBe(stringService);
      expect(serviceRegistry.get('number')).toBe(numberService);
      expect(serviceRegistry.get('object')).toEqual(objectService);
      expect(serviceRegistry.get('function')).toEqual(functionService);
    });
  });

  describe('get', () => {
    it('should retrieve registered service', () => {
      const mockService = { value: 'test' };
      serviceRegistry.register('testService', mockService);

      const result = serviceRegistry.get('testService');

      expect(result).toEqual(mockService);
    });

    it('should return null for non-existent service', () => {
      const result = serviceRegistry.get('nonExistent');

      expect(result).toBeNull();
    });

    it('should support generic typing', () => {
      interface TestService {
        getValue(): string;
      }

      const testService: TestService = {
        getValue: () => 'test',
      };
      serviceRegistry.register('test', testService);

      const result = serviceRegistry.get<TestService>('test');

      expect(result).toBeDefined();
      expect(result?.getValue()).toBe('test');
    });

    it('should return typed null for missing service', () => {
      const result = serviceRegistry.get<string>('missing');

      expect(result).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for registered service', () => {
      serviceRegistry.register('myService', {});

      expect(serviceRegistry.has('myService')).toBe(true);
    });

    it('should return false for non-existent service', () => {
      expect(serviceRegistry.has('nonExistent')).toBe(false);
    });

    it('should return false after service is unregistered', () => {
      serviceRegistry.register('tempService', {});
      expect(serviceRegistry.has('tempService')).toBe(true);

      serviceRegistry.unregister('tempService');

      expect(serviceRegistry.has('tempService')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove registered service', () => {
      serviceRegistry.register('toBeRemoved', {});
      expect(serviceRegistry.has('toBeRemoved')).toBe(true);

      const result = serviceRegistry.unregister('toBeRemoved');

      expect(result).toBe(true);
      expect(serviceRegistry.has('toBeRemoved')).toBe(false);
      expect(serviceRegistry.get('toBeRemoved')).toBeNull();
    });

    it('should return false when unregistering non-existent service', () => {
      const result = serviceRegistry.unregister('nonExistent');

      expect(result).toBe(false);
    });

    it('should allow re-registering after unregistering', () => {
      const service1 = { version: 1 };
      const service2 = { version: 2 };

      serviceRegistry.register('service', service1);
      serviceRegistry.unregister('service');
      expect(serviceRegistry.has('service')).toBe(false);

      serviceRegistry.register('service', service2);

      expect(serviceRegistry.has('service')).toBe(true);
      expect(serviceRegistry.get('service')).toEqual(service2);
    });
  });

  describe('clear', () => {
    it('should remove all registered services', () => {
      serviceRegistry.register('service1', {});
      serviceRegistry.register('service2', {});
      serviceRegistry.register('service3', {});

      expect(serviceRegistry.has('service1')).toBe(true);
      expect(serviceRegistry.has('service2')).toBe(true);
      expect(serviceRegistry.has('service3')).toBe(true);

      serviceRegistry.clear();

      expect(serviceRegistry.has('service1')).toBe(false);
      expect(serviceRegistry.has('service2')).toBe(false);
      expect(serviceRegistry.has('service3')).toBe(false);
    });

    it('should be safe to call clear multiple times', () => {
      serviceRegistry.register('service1', {});

      serviceRegistry.clear();
      expect(serviceRegistry.has('service1')).toBe(false);

      serviceRegistry.clear();
      expect(serviceRegistry.has('service1')).toBe(false);
    });

    it('should allow registering new services after clear', () => {
      serviceRegistry.register('oldService', {});
      serviceRegistry.clear();

      serviceRegistry.register('newService', { fresh: true });

      expect(serviceRegistry.get('newService')).toEqual({ fresh: true });
    });
  });

  describe('integration scenarios', () => {
    it('should support full service lifecycle', () => {
      const service = { id: 123, name: 'test' };

      expect(serviceRegistry.has('myService')).toBe(false);

      serviceRegistry.register('myService', service);
      expect(serviceRegistry.has('myService')).toBe(true);
      expect(serviceRegistry.get('myService')).toEqual(service);

      serviceRegistry.unregister('myService');
      expect(serviceRegistry.has('myService')).toBe(false);
    });

    it('should manage multiple services independently', () => {
      const service1 = { id: 1 };
      const service2 = { id: 2 };

      serviceRegistry.register('service1', service1);
      serviceRegistry.register('service2', service2);

      expect(serviceRegistry.get('service1')).toEqual(service1);
      expect(serviceRegistry.get('service2')).toEqual(service2);

      serviceRegistry.unregister('service1');

      expect(serviceRegistry.get('service1')).toBeNull();
      expect(serviceRegistry.get('service2')).toEqual(service2);
    });

    it('should work with exported registry instance', () => {
      const testService = { value: 'test' };

      registry.register('exported', testService);

      expect(registry.get('exported')).toEqual(testService);
    });

    it('should handle service names with special characters', () => {
      const service = { data: 'test' };

      serviceRegistry.register('service-with-dash', service);
      serviceRegistry.register('service_with_underscore', service);
      serviceRegistry.register('service.with.dots', service);

      expect(serviceRegistry.get('service-with-dash')).toEqual(service);
      expect(serviceRegistry.get('service_with_underscore')).toEqual(service);
      expect(serviceRegistry.get('service.with.dots')).toEqual(service);
    });
  });

  describe('type safety', () => {
    it('should maintain type information for services', () => {
      interface Logger {
        log(message: string): void;
      }

      const loggerService: Logger = {
        log: (message) => console.log(message),
      };

      serviceRegistry.register<Logger>('logger', loggerService);

      const retrieved = serviceRegistry.get<Logger>('logger');

      expect(retrieved).toBeDefined();
      expect(retrieved?.log).toBeDefined();
      expect(typeof retrieved?.log).toBe('function');
    });

    it('should support multiple service types simultaneously', () => {
      interface ConfigService {
        get(key: string): any;
      }

      interface Database {
        query(sql: string): any[];
      }

      const configService: ConfigService = {
        get: () => 'value',
      };

      const dbService: Database = {
        query: () => [],
      };

      serviceRegistry.register<ConfigService>('config', configService);
      serviceRegistry.register<Database>('database', dbService);

      const config = serviceRegistry.get<ConfigService>('config');
      const db = serviceRegistry.get<Database>('database');

      expect(config?.get).toBeDefined();
      expect(db?.query).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty service name', () => {
      const service = { value: 'test' };
      serviceRegistry.register('', service);

      expect(serviceRegistry.get('')).toEqual(service);
    });

    it('should handle service name with numbers', () => {
      const service = { value: 'test' };
      serviceRegistry.register('service123', service);

      expect(serviceRegistry.get('service123')).toEqual(service);
    });

    it('should handle large number of services', () => {
      const serviceCount = 100;

      for (let i = 0; i < serviceCount; i++) {
        serviceRegistry.register(`service${i}`, { id: i });
      }

      expect(serviceRegistry.has('service0')).toBe(true);
      expect(serviceRegistry.has('service99')).toBe(true);

      for (let i = 0; i < serviceCount; i++) {
        const service = serviceRegistry.get(`service${i}`);
        expect(service).toEqual({ id: i });
      }
    });
  });
});
