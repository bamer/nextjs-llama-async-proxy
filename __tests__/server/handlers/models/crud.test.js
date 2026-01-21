/**
 * @jest-environment node
 */

/**
 * Models CRUD Handlers Tests
 * Tests for Socket.IO model CRUD operation handlers
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

describe("Models CRUD Handlers", () => {
  let registerModelsCrudHandlers;
  let mockSocket;
  let mockIo;
  let mockDb;

  // Helper to create mock socket with emit tracking
  function createMockSocket() {
    const handlers = {};
    const emitCalls = [];
    return {
      on: function (event, handler) {
        handlers[event] = handler;
      },
      emit: function (event, data) {
        emitCalls.push({ event, data });
      },
      handlers,
      emitCalls,
    };
  }

  // Helper to create mock io with emit tracking
  function createMockIo() {
    const emitCalls = [];
    return {
      emit: function (event, data) {
        emitCalls.push({ event, data });
      },
      emitCalls,
    };
  }

  // Helper to create mock db with tracking
  function createMockDb(initialModels = []) {
    let models = [...initialModels];
    const getModelsCalls = [];
    const getModelCalls = [];
    const saveModelCalls = [];
    const updateModelCalls = [];
    const deleteModelCalls = [];

    return {
      getModels: function () {
        getModelsCalls.push("getModels");
        return models;
      },
      getModel: function (modelId) {
        getModelCalls.push(modelId);
        return models.find((m) => m.id === modelId) || null;
      },
      saveModel: function (model) {
        const newModel = {
          id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...model,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        models.push(newModel);
        saveModelCalls.push(newModel);
        return newModel;
      },
      updateModel: function (modelId, updates) {
        updateModelCalls.push({ modelId, updates });
        const idx = models.findIndex((m) => m.id === modelId);
        if (idx !== -1) {
          models[idx] = { ...models[idx], ...updates, updated_at: Date.now() };
          return models[idx];
        }
        return null;
      },
      deleteModel: function (modelId) {
        deleteModelCalls.push(modelId);
        const idx = models.findIndex((m) => m.id === modelId);
        if (idx !== -1) {
          models.splice(idx, 1);
          return true;
        }
        return false;
      },
      _setModels: function (newModels) {
        models = newModels;
      },
      _getModelsSnapshot: function () {
        return [...models];
      },
      getModelsCalls,
      getModelCalls,
      saveModelCalls,
      updateModelCalls,
      deleteModelCalls,
      _resetCalls: function () {
        getModelsCalls.length = 0;
        getModelCalls.length = 0;
        saveModelCalls.length = 0;
        updateModelCalls.length = 0;
        deleteModelCalls.length = 0;
      },
    };
  }

  beforeEach(async () => {
    // Import the module before each test
    const module =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/crud.js");
    registerModelsCrudHandlers = module.registerModelsCrudHandlers;

    // Create fresh mocks for each test
    mockSocket = createMockSocket();
    mockIo = createMockIo();
    mockDb = createMockDb();
  });

  describe("registerModelsCrudHandlers", () => {
    it("should register all CRUD event handlers", () => {
      // Arrange: Create socket and db mocks
      const socket = createMockSocket();
      const io = createMockIo();
      const db = createMockDb();

      // Act: Register handlers
      registerModelsCrudHandlers(socket, io, db);

      // Assert: All handlers should be registered as functions
      expect(typeof socket.handlers["models:list"]).toBe("function");
      expect(typeof socket.handlers["models:get"]).toBe("function");
      expect(typeof socket.handlers["models:create"]).toBe("function");
      expect(typeof socket.handlers["models:update"]).toBe("function");
      expect(typeof socket.handlers["models:delete"]).toBe("function");
    });

    it("should not emit anything during registration", () => {
      // Arrange
      const socket = createMockSocket();
      const io = createMockIo();
      const db = createMockDb();

      // Act: Register handlers
      registerModelsCrudHandlers(socket, io, db);

      // Assert: No emits should happen during registration
      expect(socket.emitCalls.length).toBe(0);
      expect(io.emitCalls.length).toBe(0);
    });
  });

  describe("models:list event", () => {
    describe("positive tests - correct functionality", () => {
      it("should return all models when getModels succeeds", async () => {
        // Arrange: Set up models in the database
        const testModels = [
          { id: "model_1", name: "Model 1", type: "llama", status: "loaded" },
          { id: "model_2", name: "Model 2", type: "mistral", status: "unloaded" },
        ];
        mockDb._setModels(testModels);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger models:list event
        await mockSocket.handlers["models:list"]({ requestId: 1001 });

        // Assert: Should emit success response with all models
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("models:list:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.models).toEqual(testModels);
        expect(mockSocket.emitCalls[0].data.data.models.length).toBe(2);
      });

      it("should return empty array when no models exist", async () => {
        // Arrange: Empty models list
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:list"]({ requestId: 1002 });

        // Assert: Should return empty array
        expect(mockSocket.emitCalls[0].data.data.models).toEqual([]);
        expect(mockSocket.emitCalls[0].data.data.models.length).toBe(0);
      });

      it("should use provided requestId in response", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const requestId = 12345;

        // Act: Trigger models:list with requestId
        await mockSocket.handlers["models:list"]({ requestId });

        // Assert: Response should include the requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should generate timestamp in response", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["models:list"]({});

        // Assert: Response should include timestamp
        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(typeof response.timestamp).toBe("number");
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should call db.getModels to retrieve models", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:list"]({});

        // Assert: Should have called getModels
        expect(mockDb.getModelsCalls.length).toBeGreaterThanOrEqual(1);
      });

      it("should return models with all their properties", async () => {
        // Arrange: Models with comprehensive properties
        const testModels = [
          {
            id: "model_1",
            name: "Test Model",
            type: "llama",
            status: "loaded",
            file_size: 4096000000,
            params: "7B",
            quantization: "Q4_K_M",
            ctx_size: 4096,
          },
        ];
        mockDb._setModels(testModels);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:list"]({ requestId: 1003 });

        // Assert: Should return model with all properties
        const returnedModel = mockSocket.emitCalls[0].data.data.models[0];
        expect(returnedModel.id).toBe("model_1");
        expect(returnedModel.name).toBe("Test Model");
        expect(returnedModel.file_size).toBe(4096000000);
        expect(returnedModel.params).toBe("7B");
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when getModels throws", async () => {
        // Arrange: Make getModels throw an error
        mockDb.getModels = function () {
          throw new Error("Database read error");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:list"]({ requestId: 1004 });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("models:list:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Database read error");
      });

      it("should use default requestId when not provided", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger without requestId
        await mockSocket.handlers["models:list"]({});

        // Assert: Should have a requestId (generated from Date.now())
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
        expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
      });

      it("should handle undefined request gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with undefined req
        await mockSocket.handlers["models:list"](undefined);

        // Assert: Should still emit response with generated requestId
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      });

      it("should handle null request gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with null req
        await mockSocket.handlers["models:list"](null);

        // Assert: Should still emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should return error when db throws specific error types", async () => {
        // Arrange
        mockDb.getModels = function () {
          throw new Error("SQLITE_CONSTRAINT: UNIQUE constraint failed");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:list"]({ requestId: 1005 });

        // Assert: Should emit error with the specific message
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe(
          "SQLITE_CONSTRAINT: UNIQUE constraint failed"
        );
      });

      it("should return error when db throws permission error", async () => {
        // Arrange
        mockDb.getModels = function () {
          throw new Error("EACCES: permission denied");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:list"]({ requestId: 1006 });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("EACCES: permission denied");
      });
    });
  });

  describe("models:get event", () => {
    describe("positive tests - correct functionality", () => {
      it("should return single model when it exists", async () => {
        // Arrange: Set up a model in the database
        const testModel = { id: "model_1", name: "Test Model", type: "llama", status: "loaded" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger models:get event
        await mockSocket.handlers["models:get"]({ modelId: "model_1", requestId: 2001 });

        // Assert: Should emit success response with the model
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("models:get:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.model).toEqual(testModel);
      });

      it("should use provided requestId in response", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const requestId = 12345;

        // Act: Trigger models:get with requestId
        await mockSocket.handlers["models:get"]({ modelId: "model_1", requestId });

        // Assert: Response should include the requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should generate timestamp in response", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["models:get"]({ modelId: "model_1" });

        // Assert: Response should include timestamp
        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should call db.getModel with correct modelId", async () => {
        // Arrange
        const testModel = { id: "model_abc", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:get"]({ modelId: "model_abc" });

        // Assert: Should have called getModel with correct id
        expect(mockDb.getModelCalls.length).toBe(1);
        expect(mockDb.getModelCalls[0]).toBe("model_abc");
      });

      it("should return model with all its properties", async () => {
        // Arrange: Model with comprehensive properties
        const testModel = {
          id: "model_1",
          name: "Large Model",
          type: "llama",
          status: "unloaded",
          file_size: 8192000000,
          params: "13B",
          quantization: "Q5_K_M",
          ctx_size: 8192,
          embedding_length: 5120,
          block_count: 40,
          head_count: 32,
        };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:get"]({ modelId: "model_1", requestId: 2002 });

        // Assert: Should return model with all properties
        const returnedModel = mockSocket.emitCalls[0].data.data.model;
        expect(returnedModel.id).toBe("model_1");
        expect(returnedModel.file_size).toBe(8192000000);
        expect(returnedModel.params).toBe("13B");
        expect(returnedModel.ctx_size).toBe(8192);
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when model is not found", async () => {
        // Arrange: Empty database
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Try to get non-existent model
        await mockSocket.handlers["models:get"]({ modelId: "nonexistent", requestId: 2003 });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("models:get:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });

      it("should return error when getModel throws", async () => {
        // Arrange: Make getModel throw an error
        mockDb.getModel = function () {
          throw new Error("Database read error");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:get"]({ modelId: "model_1", requestId: 2004 });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Database read error");
      });

      it("should use default requestId when not provided", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger without requestId
        await mockSocket.handlers["models:get"]({ modelId: "model_1" });

        // Assert: Should have a requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      });

      it("should handle undefined modelId gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with undefined modelId
        await mockSocket.handlers["models:get"]({ modelId: undefined, requestId: 2005 });

        // Assert: Should try to find model with undefined id and return not found
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });

      it("should handle null modelId gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with null modelId
        await mockSocket.handlers["models:get"]({ modelId: null, requestId: 2006 });

        // Assert: Should try to find model with null id and return not found
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });

      it("should handle undefined request gracefully", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with undefined req
        await mockSocket.handlers["models:get"](undefined);

        // Assert: Should still emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });

      it("should handle null request gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with null req
        await mockSocket.handlers["models:get"](null);

        // Assert: Should still emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });
    });
  });

  describe("models:create event", () => {
    describe("positive tests - correct functionality", () => {
      it("should create a new model and return it", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const newModel = { name: "New Model", type: "llama", status: "unloaded" };

        // Act: Trigger models:create event
        await mockSocket.handlers["models:create"]({ model: newModel, requestId: 3001 });

        // Assert: Should emit success response with created model
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("models:create:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.model).toBeDefined();
        expect(mockSocket.emitCalls[0].data.data.model.name).toBe("New Model");
      });

      it("should broadcast models:created event to all clients", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const newModel = { name: "Test Model", type: "mistral" };

        // Act
        await mockSocket.handlers["models:create"]({ model: newModel, requestId: 3002 });

        // Assert: Should broadcast to io
        expect(mockIo.emitCalls.length).toBe(1);
        expect(mockIo.emitCalls[0].event).toBe("models:created");
        expect(mockIo.emitCalls[0].data.model).toBeDefined();
        expect(mockIo.emitCalls[0].data.model.name).toBe("Test Model");
      });

      it("should use provided requestId in response", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const requestId = 12345;

        // Act
        await mockSocket.handlers["models:create"]({ model: {}, requestId });

        // Assert: Response should include the requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should generate timestamp in response", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["models:create"]({ model: {} });

        // Assert: Response should include timestamp
        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should call db.saveModel with correct model data", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const modelData = { name: "Test Model", type: "llama", status: "loaded" };

        // Act
        await mockSocket.handlers["models:create"]({ model: modelData, requestId: 3003 });

        // Assert: Should have called saveModel
        expect(mockDb.saveModelCalls.length).toBe(1);
        expect(mockDb.saveModelCalls[0].name).toBe("Test Model");
        expect(mockDb.saveModelCalls[0].type).toBe("llama");
      });

      it("should generate unique id for new model", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Create two models
        await mockSocket.handlers["models:create"]({ model: { name: "Model 1" }, requestId: 3004 });
        await mockSocket.handlers["models:create"]({ model: { name: "Model 2" }, requestId: 3005 });

        // Assert: Each model should have a unique id
        const model1 = mockSocket.emitCalls[0].data.data.model;
        const model2 = mockSocket.emitCalls[1].data.data.model;
        expect(model1.id).not.toBe(model2.id);
        expect(model1.id).toMatch(/^model_\d+_[a-z0-9]+$/);
        expect(model2.id).toMatch(/^model_\d+_[a-z0-9]+$/);
      });

      it("should create model with default empty object when no model provided", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Create without model data
        await mockSocket.handlers["models:create"]({ requestId: 3006 });

        // Assert: Should still create a model with generated id
        expect(mockDb.saveModelCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.data.model.id).toBeDefined();
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when saveModel throws", async () => {
        // Arrange: Make saveModel throw an error
        mockDb.saveModel = function () {
          throw new Error("Database write error");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:create"]({ model: { name: "Test" }, requestId: 3007 });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Database write error");
      });

      it("should use default requestId when not provided", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger without requestId
        await mockSocket.handlers["models:create"]({ model: {} });

        // Assert: Should have a requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      });

      it("should handle undefined request gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with undefined req
        await mockSocket.handlers["models:create"](undefined);

        // Assert: Should still try to create model with undefined
        expect(mockDb.saveModelCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle null request gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with null req
        await mockSocket.handlers["models:create"](null);

        // Assert: Should still try to create model
        expect(mockDb.saveModelCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle undefined model gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with undefined model
        await mockSocket.handlers["models:create"]({ model: undefined, requestId: 3008 });

        // Assert: Should use undefined (becomes empty object in handler)
        expect(mockDb.saveModelCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle null model gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with null model
        await mockSocket.handlers["models:create"]({ model: null, requestId: 3009 });

        // Assert: Should use null (becomes empty object in handler)
        expect(mockDb.saveModelCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should return error when db throws constraint error", async () => {
        // Arrange
        mockDb.saveModel = function () {
          throw new Error("UNIQUE constraint failed: models.name");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:create"]({
          model: { name: "Duplicate" },
          requestId: 3010,
        });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe(
          "UNIQUE constraint failed: models.name"
        );
      });
    });
  });

  describe("models:update event", () => {
    describe("positive tests - correct functionality", () => {
      it("should update an existing model and return it", async () => {
        // Arrange: Set up a model in the database
        const testModel = {
          id: "model_1",
          name: "Original Name",
          type: "llama",
          status: "unloaded",
        };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger models:update event
        await mockSocket.handlers["models:update"]({
          modelId: "model_1",
          updates: { name: "Updated Name", status: "loaded" },
          requestId: 4001,
        });

        // Assert: Should emit success response with updated model
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("models:update:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.model).toBeDefined();
        expect(mockSocket.emitCalls[0].data.data.model.name).toBe("Updated Name");
        expect(mockSocket.emitCalls[0].data.data.model.status).toBe("loaded");
      });

      it("should broadcast models:updated event to all clients", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:update"]({
          modelId: "model_1",
          updates: { name: "New Name" },
          requestId: 4002,
        });

        // Assert: Should broadcast to io
        expect(mockIo.emitCalls.length).toBe(1);
        expect(mockIo.emitCalls[0].event).toBe("models:updated");
        expect(mockIo.emitCalls[0].data.model).toBeDefined();
        expect(mockIo.emitCalls[0].data.model.name).toBe("New Name");
      });

      it("should use provided requestId in response", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const requestId = 12345;

        // Act
        await mockSocket.handlers["models:update"]({ modelId: "model_1", updates: {}, requestId });

        // Assert: Response should include the requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should generate timestamp in response", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["models:update"]({ modelId: "model_1", updates: {} });

        // Assert: Response should include timestamp
        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should call db.updateModel with correct parameters", async () => {
        // Arrange
        const testModel = { id: "model_abc", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:update"]({
          modelId: "model_abc",
          updates: { status: "loaded" },
          requestId: 4003,
        });

        // Assert: Should have called updateModel with correct params
        expect(mockDb.updateModelCalls.length).toBe(1);
        expect(mockDb.updateModelCalls[0].modelId).toBe("model_abc");
        expect(mockDb.updateModelCalls[0].updates).toEqual({ status: "loaded" });
      });

      it("should update multiple fields at once", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Name", status: "unloaded", ctx_size: 2048 };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:update"]({
          modelId: "model_1",
          updates: { name: "New Name", status: "loaded", ctx_size: 4096 },
          requestId: 4004,
        });

        // Assert: Should update all fields
        const updatedModel = mockSocket.emitCalls[0].data.data.model;
        expect(updatedModel.name).toBe("New Name");
        expect(updatedModel.status).toBe("loaded");
        expect(updatedModel.ctx_size).toBe(4096);
      });

      it("should use empty updates object when not provided", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Update without providing updates
        await mockSocket.handlers["models:update"]({ modelId: "model_1", requestId: 4005 });

        // Assert: Should still call updateModel with empty object
        expect(mockDb.updateModelCalls.length).toBe(1);
        expect(mockDb.updateModelCalls[0].updates).toEqual({});
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when model is not found", async () => {
        // Arrange: Empty database
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Try to update non-existent model
        await mockSocket.handlers["models:update"]({
          modelId: "nonexistent",
          updates: { name: "New Name" },
          requestId: 4006,
        });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("models:update:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });

      it("should return error when updateModel throws", async () => {
        // Arrange: Make updateModel throw an error
        mockDb.updateModel = function () {
          throw new Error("Database write error");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:update"]({
          modelId: "model_1",
          updates: { name: "New Name" },
          requestId: 4007,
        });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Database write error");
      });

      it("should not broadcast when model not found", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:update"]({
          modelId: "nonexistent",
          updates: { name: "Test" },
          requestId: 4008,
        });

        // Assert: Should not broadcast to io
        expect(mockIo.emitCalls.length).toBe(0);
      });

      it("should use default requestId when not provided", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger without requestId
        await mockSocket.handlers["models:update"]({ modelId: "model_1", updates: {} });

        // Assert: Should have a requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      });

      it("should handle undefined modelId gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with undefined modelId
        await mockSocket.handlers["models:update"]({
          modelId: undefined,
          updates: { name: "Test" },
          requestId: 4009,
        });

        // Assert: Should return not found error
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });

      it("should handle null modelId gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with null modelId
        await mockSocket.handlers["models:update"]({
          modelId: null,
          updates: { name: "Test" },
          requestId: 4010,
        });

        // Assert: Should return not found error
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });

      it("should handle undefined request gracefully", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with undefined req
        await mockSocket.handlers["models:update"](undefined);

        // Assert: Should still emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });

      it("should handle null request gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with null req
        await mockSocket.handlers["models:update"](null);

        // Assert: Should still emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Not found");
      });

      it("should return error when db throws constraint error", async () => {
        // Arrange
        mockDb.updateModel = function () {
          throw new Error("UNIQUE constraint failed: models.name");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:update"]({
          modelId: "model_1",
          updates: { name: "Duplicate" },
          requestId: 4011,
        });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe(
          "UNIQUE constraint failed: models.name"
        );
      });
    });
  });

  describe("models:delete event", () => {
    describe("positive tests - correct functionality", () => {
      it("should delete an existing model and return deletedId", async () => {
        // Arrange: Set up a model in the database
        const testModel = { id: "model_1", name: "Test Model", type: "llama" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger models:delete event
        await mockSocket.handlers["models:delete"]({ modelId: "model_1", requestId: 5001 });

        // Assert: Should emit success response with deletedId
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("models:delete:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.deletedId).toBe("model_1");
      });

      it("should broadcast models:deleted event to all clients", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:delete"]({ modelId: "model_1", requestId: 5002 });

        // Assert: Should broadcast to io
        expect(mockIo.emitCalls.length).toBe(1);
        expect(mockIo.emitCalls[0].event).toBe("models:deleted");
        expect(mockIo.emitCalls[0].data.modelId).toBe("model_1");
      });

      it("should use provided requestId in response", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const requestId = 12345;

        // Act
        await mockSocket.handlers["models:delete"]({ modelId: "model_1", requestId });

        // Assert: Response should include the requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBe(requestId);
      });

      it("should generate timestamp in response", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);
        const beforeCall = Date.now();

        // Act
        await mockSocket.handlers["models:delete"]({ modelId: "model_1" });

        // Assert: Response should include timestamp
        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should call db.deleteModel with correct modelId", async () => {
        // Arrange
        const testModel = { id: "model_abc", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:delete"]({ modelId: "model_abc", requestId: 5003 });

        // Assert: Should have called deleteModel with correct id
        expect(mockDb.deleteModelCalls.length).toBe(1);
        expect(mockDb.deleteModelCalls[0]).toBe("model_abc");
      });

      it("should remove model from database", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:delete"]({ modelId: "model_1", requestId: 5004 });

        // Assert: Model should be removed from database
        const models = mockDb._getModelsSnapshot();
        expect(models.length).toBe(0);
        expect(models.find((m) => m.id === "model_1")).toBeUndefined();
      });

      it("should delete multiple models one at a time", async () => {
        // Arrange
        const testModels = [
          { id: "model_1", name: "Model 1" },
          { id: "model_2", name: "Model 2" },
          { id: "model_3", name: "Model 3" },
        ];
        mockDb._setModels(testModels);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Delete first model
        await mockSocket.handlers["models:delete"]({ modelId: "model_1", requestId: 5005 });
        // Delete second model
        await mockSocket.handlers["models:delete"]({ modelId: "model_2", requestId: 5006 });

        // Assert: Two models should be deleted
        const models = mockDb._getModelsSnapshot();
        expect(models.length).toBe(1);
        expect(models[0].id).toBe("model_3");
        expect(mockDb.deleteModelCalls.length).toBe(2);
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when deleteModel throws", async () => {
        // Arrange: Make deleteModel throw an error
        mockDb.deleteModel = function () {
          throw new Error("Database write error");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:delete"]({ modelId: "model_1", requestId: 5007 });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Database write error");
      });

      it("should use default requestId when not provided", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger without requestId
        await mockSocket.handlers["models:delete"]({ modelId: "model_1" });

        // Assert: Should have a requestId
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      });

      it("should handle undefined modelId gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with undefined modelId
        await mockSocket.handlers["models:delete"]({
          modelId: undefined,
          requestId: 5008,
        });

        // Assert: Should not crash, but deleteModel will be called with undefined
        expect(mockDb.deleteModelCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.deletedId).toBeUndefined();
      });

      it("should handle null modelId gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with null modelId
        await mockSocket.handlers["models:delete"]({
          modelId: null,
          requestId: 5009,
        });

        // Assert: Should not crash
        expect(mockDb.deleteModelCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.deletedId).toBeNull();
      });

      it("should handle undefined request gracefully", async () => {
        // Arrange
        const testModel = { id: "model_1", name: "Test Model" };
        mockDb._setModels([testModel]);
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with undefined req
        await mockSocket.handlers["models:delete"](undefined);

        // Assert: Should still emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle null request gracefully", async () => {
        // Arrange
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act: Trigger with null req
        await mockSocket.handlers["models:delete"](null);

        // Assert: Should still emit response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should handle foreign key constraint error", async () => {
        // Arrange
        mockDb.deleteModel = function () {
          throw new Error("FOREIGN KEY constraint failed");
        };
        registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

        // Act
        await mockSocket.handlers["models:delete"]({ modelId: "model_1", requestId: 5010 });

        // Assert: Should emit error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("FOREIGN KEY constraint failed");
      });
    });
  });

  describe("response format", () => {
    it("should include all required fields in success response", async () => {
      // Arrange
      const testModel = { id: "model_1", name: "Test Model" };
      mockDb._setModels([testModel]);
      registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

      // Act
      await mockSocket.handlers["models:get"]({ modelId: "model_1", requestId: 6001 });

      // Assert: Success response should have all required fields
      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(response).toHaveProperty("requestId", 6001);
      expect(response).toHaveProperty("timestamp");
      expect(response.data).toHaveProperty("model");
    });

    it("should include all required fields in error response", async () => {
      // Arrange
      mockDb.getModels = function () {
        throw new Error("Test error");
      };
      registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

      // Act
      await mockSocket.handlers["models:list"]({ requestId: 6002 });

      // Assert: Error response should have all required fields
      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("message");
      expect(response).toHaveProperty("requestId", 6002);
      expect(response).toHaveProperty("timestamp");
    });

    it("should include timestamp as number", async () => {
      // Arrange
      registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

      // Act
      await mockSocket.handlers["models:list"]({ requestId: 6003 });

      // Assert
      const response = mockSocket.emitCalls[0].data;
      expect(typeof response.timestamp).toBe("number");
      expect(response.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("integration scenarios", () => {
    it("should handle full CRUD lifecycle", async () => {
      // Arrange
      registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

      // Act: 1. Create a model
      await mockSocket.handlers["models:create"]({ model: { name: "New Model" }, requestId: 7001 });
      const createdModel = mockSocket.emitCalls[0].data.data.model;
      const modelId = createdModel.id;

      // Act: 2. Get the created model
      await mockSocket.handlers["models:get"]({ modelId, requestId: 7002 });
      expect(mockSocket.emitCalls[1].data.data.model.name).toBe("New Model");

      // Act: 3. Update the model
      await mockSocket.handlers["models:update"]({
        modelId,
        updates: { name: "Updated Model", status: "loaded" },
        requestId: 7003,
      });
      expect(mockSocket.emitCalls[2].data.data.model.name).toBe("Updated Model");

      // Act: 4. List all models
      await mockSocket.handlers["models:list"]({ requestId: 7004 });
      expect(mockSocket.emitCalls[3].data.data.models.length).toBe(1);

      // Act: 5. Delete the model
      await mockSocket.handlers["models:delete"]({ modelId, requestId: 7005 });
      expect(mockSocket.emitCalls[4].data.data.deletedId).toBe(modelId);

      // Assert: Model should be removed from list
      await mockSocket.handlers["models:list"]({ requestId: 7006 });
      expect(mockSocket.emitCalls[5].data.data.models.length).toBe(0);
    });

    it("should handle multiple consecutive creates", async () => {
      // Arrange
      registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

      // Act: Create multiple models
      await mockSocket.handlers["models:create"]({ model: { name: "Model 1" }, requestId: 7007 });
      await mockSocket.handlers["models:create"]({ model: { name: "Model 2" }, requestId: 7008 });
      await mockSocket.handlers["models:create"]({ model: { name: "Model 3" }, requestId: 7009 });

      // Assert: All models should be created
      expect(mockSocket.emitCalls.length).toBe(3);
      expect(mockDb.saveModelCalls.length).toBe(3);

      // List should return all models
      await mockSocket.handlers["models:list"]({ requestId: 7010 });
      expect(mockSocket.emitCalls[3].data.data.models.length).toBe(3);
    });

    it("should handle multiple consecutive deletes", async () => {
      // Arrange: Set up multiple models
      const testModels = [
        { id: "model_1", name: "Model 1" },
        { id: "model_2", name: "Model 2" },
        { id: "model_3", name: "Model 3" },
      ];
      mockDb._setModels(testModels);
      registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

      // Act: Delete all models
      await mockSocket.handlers["models:delete"]({ modelId: "model_1", requestId: 7011 });
      await mockSocket.handlers["models:delete"]({ modelId: "model_2", requestId: 7012 });
      await mockSocket.handlers["models:delete"]({ modelId: "model_3", requestId: 7013 });

      // Assert: All delete operations should succeed
      expect(mockSocket.emitCalls.length).toBe(3);
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[1].data.success).toBe(true);
      expect(mockSocket.emitCalls[2].data.success).toBe(true);
      expect(mockDb.deleteModelCalls.length).toBe(3);

      // List should return empty array
      await mockSocket.handlers["models:list"]({ requestId: 7014 });
      expect(mockSocket.emitCalls[3].data.data.models.length).toBe(0);
    });

    it("should broadcast events correctly for create/update/delete", async () => {
      // Arrange
      registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

      // Act: Create
      await mockSocket.handlers["models:create"]({ model: { name: "Test" }, requestId: 7015 });
      expect(mockIo.emitCalls[0].event).toBe("models:created");

      // Act: Update
      const modelId = mockSocket.emitCalls[0].data.data.model.id;
      await mockSocket.handlers["models:update"]({
        modelId,
        updates: { name: "Updated" },
        requestId: 7016,
      });
      expect(mockIo.emitCalls[1].event).toBe("models:updated");

      // Act: Delete
      await mockSocket.handlers["models:delete"]({ modelId, requestId: 7017 });
      expect(mockIo.emitCalls[2].event).toBe("models:deleted");

      // Assert: All broadcasts should contain model data
      expect(mockIo.emitCalls[0].data.model.name).toBe("Test");
      expect(mockIo.emitCalls[1].data.model.name).toBe("Updated");
      expect(mockIo.emitCalls[2].data.modelId).toBe(modelId);
    });

    it("should handle list-get-list pattern", async () => {
      // Arrange: Set up models
      const testModels = [
        { id: "model_1", name: "Model 1" },
        { id: "model_2", name: "Model 2" },
      ];
      mockDb._setModels(testModels);
      registerModelsCrudHandlers(mockSocket, mockIo, mockDb);

      // Act: List all models
      await mockSocket.handlers["models:list"]({ requestId: 7018 });
      const model1Id = mockSocket.emitCalls[0].data.data.models[0].id;

      // Get first model
      await mockSocket.handlers["models:get"]({ modelId: model1Id, requestId: 7019 });

      // List again
      await mockSocket.handlers["models:list"]({ requestId: 7020 });

      // Assert: Should return consistent data
      expect(mockSocket.emitCalls[0].data.data.models.length).toBe(2);
      expect(mockSocket.emitCalls[1].data.data.model.id).toBe(model1Id);
      expect(mockSocket.emitCalls[2].data.data.models.length).toBe(2);
    });
  });
});
