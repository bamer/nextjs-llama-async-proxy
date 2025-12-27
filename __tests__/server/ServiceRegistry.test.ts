"use client";

import { ServiceRegistry, registry } from "@/server/ServiceRegistry";

describe("ServiceRegistry", () => {
  beforeEach(() => {
    registry.clear();
  });

  describe("getInstance", () => {
    it("should return the same instance (singleton pattern)", () => {
      const instance1 = ServiceRegistry.getInstance();
      const instance2 = ServiceRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("register", () => {
    it("should register a service successfully", () => {
      const mockService = { name: "test" };
      registry.register("testService", mockService);
      expect(registry.has("testService")).toBe(true);
    });

    it("should overwrite existing service when registering with same name", () => {
      const mockService1 = { name: "service1" };
      const mockService2 = { name: "service2" };
      registry.register("testService", mockService1);
      registry.register("testService", mockService2);
      const retrieved = registry.get<{ name: string }>("testService");
      expect(retrieved?.name).toBe("service2");
    });
  });

  describe("get", () => {
    it("should retrieve a registered service", () => {
      const mockService = { name: "test", value: 42 };
      registry.register("testService", mockService);
      const retrieved = registry.get<{ name: string; value: number }>("testService");
      expect(retrieved).toEqual(mockService);
    });

    it("should return null for non-existent service", () => {
      const retrieved = registry.get<unknown>("nonExistentService");
      expect(retrieved).toBeNull();
    });
  });

  describe("has", () => {
    it("should return true for registered service", () => {
      registry.register("testService", { name: "test" });
      expect(registry.has("testService")).toBe(true);
    });

    it("should return false for non-existent service", () => {
      expect(registry.has("nonExistentService")).toBe(false);
    });
  });

  describe("unregister", () => {
    it("should unregister an existing service", () => {
      registry.register("testService", { name: "test" });
      const result = registry.unregister("testService");
      expect(result).toBe(true);
      expect(registry.has("testService")).toBe(false);
    });

    it("should return false when unregistering non-existent service", () => {
      const result = registry.unregister("nonExistentService");
      expect(result).toBe(false);
    });
  });

  describe("clear", () => {
    it("should clear all registered services", () => {
      registry.register("service1", { name: "service1" });
      registry.register("service2", { name: "service2" });
      registry.register("service3", { name: "service3" });
      expect(registry.has("service1")).toBe(true);
      expect(registry.has("service2")).toBe(true);
      expect(registry.has("service3")).toBe(true);

      registry.clear();

      expect(registry.has("service1")).toBe(false);
      expect(registry.has("service2")).toBe(false);
      expect(registry.has("service3")).toBe(false);
    });
  });

  describe("type safety", () => {
    it("should maintain type information for registered services", () => {
      interface TestService {
        getValue(): number;
        setName(name: string): void;
      }

      const testService: TestService = {
        getValue: () => 42,
        setName: jest.fn(),
      };

      registry.register<TestService>("typedService", testService);
      const retrieved = registry.get<TestService>("typedService");

      expect(retrieved).toBeDefined();
      expect(retrieved?.getValue()).toBe(42);
      expect(typeof retrieved?.setName).toBe("function");
    });
  });
});
