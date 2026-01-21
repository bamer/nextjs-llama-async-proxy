/**
 * @jest-environment node
 */

/**
 * Response Handlers Unit Tests
 * Tests for Socket.IO response formatting utilities
 */

describe("Response Handlers", () => {
  let mockSocket;
  let ok;
  let err;

  // Helper to create mock socket with emit tracking
  function createMockSocket() {
    const emitCalls = [];

    return {
      emit: function (event, data) {
        emitCalls.push({ event, data });
      },
      emitCalls,
      _getLastEmit: function () {
        return emitCalls[emitCalls.length - 1];
      },
      _getEmitCount: function () {
        return emitCalls.length;
      },
      _clearEmits: function () {
        emitCalls.length = 0;
      },
    };
  }

  beforeEach(async () => {
    // Import the module fresh for each test
    const module = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/response.js");
    ok = module.ok;
    err = module.err;
    mockSocket = createMockSocket();
  });

  describe("ok function - success response", () => {
    it("should emit correct success format with success: true", () => {
      // Arrange
      const event = "test:response";
      const data = { result: "success", value: 42 };
      const reqId = "req-123";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok emits correct success format with success: true
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.success).toBe(true);
    });

    it("should include data parameter in response", () => {
      // Arrange
      const event = "models:list";
      const testData = { models: ["model1.gguf", "model2.gguf"], count: 2 };
      const reqId = "req-456";

      // Act
      ok(mockSocket, event, testData, reqId);

      // Assert - Verifies ok includes data parameter in response
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toEqual(testData);
      expect(emitData.data.models).toEqual(["model1.gguf", "model2.gguf"]);
      expect(emitData.data.count).toBe(2);
    });

    it("should include requestId in response", () => {
      // Arrange
      const event = "config:get";
      const data = { key: "value" };
      const reqId = "req-789-abc";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok includes requestId in response
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.requestId).toBe(reqId);
      expect(emitData.requestId).toBe("req-789-abc");
    });

    it("should include timestamp in response", () => {
      // Arrange
      const beforeTime = Date.now();
      const event = "test:response";
      const data = null;
      const reqId = "req-timestamp";

      // Act
      ok(mockSocket, event, data, reqId);
      const afterTime = Date.now();

      // Assert - Verifies ok includes timestamp in response
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.timestamp).toBeDefined();
      expect(typeof emitData.timestamp).toBe("number");
      expect(emitData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(emitData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("should emit to the correct event name", () => {
      // Arrange
      const event = "connection:established";
      const data = { clientId: "socket-123" };
      const reqId = "req-event";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok emits to the correct event name
      const emitCall = mockSocket._getLastEmit();
      expect(emitCall.event).toBe(event);
      expect(emitCall.event).toBe("connection:established");
    });

    it("should handle null data parameter", () => {
      // Arrange
      const event = "test:null";
      const data = null;
      const reqId = "req-null";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles null data parameter
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toBeNull();
      expect(emitData.success).toBe(true);
    });

    it("should handle undefined data parameter", () => {
      // Arrange
      const event = "test:undefined";
      const data = undefined;
      const reqId = "req-undefined";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles undefined data parameter
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toBeUndefined();
      expect(emitData.success).toBe(true);
    });

    it("should handle empty object data", () => {
      // Arrange
      const event = "test:empty";
      const data = {};
      const reqId = "req-empty";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles empty object data
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toEqual({});
      expect(Object.keys(emitData.data).length).toBe(0);
    });

    it("should handle complex nested data object", () => {
      // Arrange
      const event = "test:complex";
      const data = {
        users: [
          { id: 1, name: "Alice", active: true },
          { id: 2, name: "Bob", active: false },
        ],
        metadata: {
          total: 2,
          page: 1,
          filters: { status: "all" },
        },
      };
      const reqId = "req-complex";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles complex nested data object
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toEqual(data);
      expect(emitData.data.users).toHaveLength(2);
      expect(emitData.data.metadata.filters.status).toBe("all");
    });

    it("should handle array data", () => {
      // Arrange
      const event = "models:list";
      const data = ["model1.gguf", "model2.gguf", "model3.gguf"];
      const reqId = "req-array";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles array data
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toEqual(data);
      expect(emitData.data).toHaveLength(3);
      expect(Array.isArray(emitData.data)).toBe(true);
    });

    it("should handle numeric data", () => {
      // Arrange
      const event = "metrics:value";
      const data = 123.456;
      const reqId = "req-numeric";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles numeric data
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toBe(123.456);
    });

    it("should handle string data", () => {
      // Arrange
      const event = "logs:text";
      const data = "Operation completed successfully";
      const reqId = "req-string";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles string data
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toBe("Operation completed successfully");
    });

    it("should handle boolean data", () => {
      // Arrange
      const event = "status:check";
      const data = true;
      const reqId = "req-boolean";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles boolean data
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toBe(true);
    });

    it("should generate unique timestamps for each call", () => {
      // Arrange
      const event = "test:timestamp";
      const data = null;
      const reqId1 = "req-ts-1";

      // Act
      ok(mockSocket, event, data, reqId1);
      const firstTimestamp = mockSocket._getLastEmit().data.timestamp;

      // Small delay to ensure different timestamp
      const start = Date.now();
      while (Date.now() - start < 10) {}

      const reqId2 = "req-ts-2";
      ok(mockSocket, event, data, reqId2);
      const secondTimestamp = mockSocket._getLastEmit().data.timestamp;

      // Assert - Verifies ok generates unique timestamps for each call
      expect(secondTimestamp).toBeGreaterThan(firstTimestamp);
    });
  });

  describe("err function - error response", () => {
    it("should emit correct error format with success: false", () => {
      // Arrange
      const event = "test:error";
      const message = "Something went wrong";
      const reqId = "req-error-123";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err emits correct error format with success: false
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.success).toBe(false);
    });

    it("should include error object with message property", () => {
      // Arrange
      const event = "models:load";
      const message = "Model file not found";
      const reqId = "req-error-456";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err includes error object with message
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.error).toBeDefined();
      expect(emitData.error).toHaveProperty("message");
      expect(emitData.error.message).toBe(message);
    });

    it("should include requestId in response", () => {
      // Arrange
      const event = "config:update";
      const message = "Invalid configuration format";
      const reqId = "req-error-789";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err includes requestId in response
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.requestId).toBe(reqId);
      expect(emitData.requestId).toBe("req-error-789");
    });

    it("should include timestamp in response", () => {
      // Arrange
      const beforeTime = Date.now();
      const event = "test:error";
      const message = "Error occurred";
      const reqId = "req-error-ts";

      // Act
      err(mockSocket, event, message, reqId);
      const afterTime = Date.now();

      // Assert - Verifies err includes timestamp in response
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.timestamp).toBeDefined();
      expect(typeof emitData.timestamp).toBe("number");
      expect(emitData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(emitData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("should emit to the correct event name", () => {
      // Arrange
      const event = "connection:error";
      const message = "Connection refused";
      const reqId = "req-error-event";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err emits to the correct event name
      const emitCall = mockSocket._getLastEmit();
      expect(emitCall.event).toBe(event);
      expect(emitCall.event).toBe("connection:error");
    });

    it("should handle empty string message", () => {
      // Arrange
      const event = "test:empty-error";
      const message = "";
      const reqId = "req-empty-msg";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err handles empty string message
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.error.message).toBe("");
      expect(emitData.error.message).toHaveLength(0);
    });

    it("should handle long error messages", () => {
      // Arrange
      const event = "test:long-error";
      const message =
        "This is a very long error message that contains detailed information about what went wrong, " +
        "including context about the operation, potential causes, and suggestions for resolution. " +
        "The message should be preserved exactly as provided.";
      const reqId = "req-long-msg";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err handles long error messages
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.error.message).toBe(message);
      expect(emitData.error.message.length).toBeGreaterThan(100);
    });

    it("should handle special characters in error message", () => {
      // Arrange
      const event = "test:special-error";
      const message = "Error: Invalid JSON at position 42! Special chars: @#$%^&*()";
      const reqId = "req-special-msg";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err handles special characters in error message
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.error.message).toBe(message);
    });

    it("should handle unicode characters in error message", () => {
      // Arrange
      const event = "test:unicode-error";
      const message = "Error with unicode: 你好世界 🌍 ñáéíóú €£¥";
      const reqId = "req-unicode-msg";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err handles unicode characters in error message
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.error.message).toBe(message);
    });

    it("should handle error message with newlines", () => {
      // Arrange
      const event = "test:multiline-error";
      const message = "Error details:\n  - Line 1\n  - Line 2\n  - Line 3";
      const reqId = "req-multiline-msg";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err handles error message with newlines
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.error.message).toBe(message);
      expect(emitData.error.message).toContain("\n");
    });

    it("should handle error message with quotes", () => {
      // Arrange
      const event = "test:quote-error";
      const message = "Error: \"Invalid value\" found in field 'name'";
      const reqId = "req-quote-msg";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err handles error message with quotes
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.error.message).toBe(message);
    });

    it("should generate unique timestamps for each call", () => {
      // Arrange
      const event = "test:error-ts";
      const message = "First error";
      const reqId1 = "req-ts-err-1";

      // Act
      err(mockSocket, event, message, reqId1);
      const firstTimestamp = mockSocket._getLastEmit().data.timestamp;

      // Small delay to ensure different timestamp
      const start = Date.now();
      while (Date.now() - start < 10) {}

      const message2 = "Second error";
      const reqId2 = "req-ts-err-2";
      err(mockSocket, event, message2, reqId2);
      const secondTimestamp = mockSocket._getLastEmit().data.timestamp;

      // Assert - Verifies err generates unique timestamps for each call
      expect(secondTimestamp).toBeGreaterThan(firstTimestamp);
    });
  });

  describe("response structure verification", () => {
    it("should have correct structure for ok response", () => {
      // Arrange
      const event = "test:structure";
      const data = { key: "value" };
      const reqId = "req-struct-ok";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok has correct structure with all required fields
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData).toHaveProperty("success");
      expect(emitData).toHaveProperty("data");
      expect(emitData).toHaveProperty("requestId");
      expect(emitData).toHaveProperty("timestamp");
      expect(Object.keys(emitData).length).toBe(4);
    });

    it("should have correct structure for err response", () => {
      // Arrange
      const event = "test:structure";
      const message = "Error message";
      const reqId = "req-struct-err";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err has correct structure with all required fields
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData).toHaveProperty("success");
      expect(emitData).toHaveProperty("error");
      expect(emitData).toHaveProperty("error.message");
      expect(emitData).toHaveProperty("requestId");
      expect(emitData).toHaveProperty("timestamp");
      expect(Object.keys(emitData).length).toBe(4);
      expect(Object.keys(emitData.error).length).toBe(1);
    });

    it("should have opposite success values for ok vs err", () => {
      // Arrange
      const event = "test:compare";
      const data = { key: "value" };
      const reqId = "req-compare";
      const message = "Error message";

      // Act
      ok(mockSocket, event, data, reqId);
      const okData = mockSocket._getLastEmit().data;

      mockSocket._clearEmits();
      err(mockSocket, event, message, reqId);
      const errData = mockSocket._getLastEmit().data;

      // Assert - Verifies ok has success: true and err has success: false
      expect(okData.success).toBe(true);
      expect(errData.success).toBe(false);
      expect(okData.success).not.toBe(errData.success);
    });

    it("should preserve requestId across ok and err responses", () => {
      // Arrange
      const event = "test:reqid";
      const reqId = "req-preserve-123";
      const data = { result: "ok" };
      const message = "Error occurred";

      // Act
      ok(mockSocket, event, data, reqId);
      const okRequestId = mockSocket._getLastEmit().data.requestId;

      mockSocket._clearEmits();
      err(mockSocket, event, message, reqId);
      const errRequestId = mockSocket._getLastEmit().data.requestId;

      // Assert - Verifies both ok and err preserve requestId
      expect(okRequestId).toBe(reqId);
      expect(errRequestId).toBe(reqId);
      expect(okRequestId).toBe(errRequestId);
    });
  });

  describe("multiple emissions", () => {
    it("should track multiple emit calls", () => {
      // Arrange
      const event = "test:multi";
      const reqId = "req-multi";

      // Act
      ok(mockSocket, event, { step: 1 }, reqId);
      ok(mockSocket, event, { step: 2 }, reqId);
      err(mockSocket, event, "Error in step 3", reqId);
      ok(mockSocket, event, { step: 4 }, reqId);

      // Assert - Verifies multiple emit calls are tracked correctly
      expect(mockSocket._getEmitCount()).toBe(4);

      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.step).toBe(1);

      expect(mockSocket.emitCalls[1].data.success).toBe(true);
      expect(mockSocket.emitCalls[1].data.data.step).toBe(2);

      expect(mockSocket.emitCalls[2].data.success).toBe(false);
      expect(mockSocket.emitCalls[2].data.error.message).toBe("Error in step 3");

      expect(mockSocket.emitCalls[3].data.success).toBe(true);
      expect(mockSocket.emitCalls[3].data.data.step).toBe(4);
    });

    it("should maintain emit order for sequential responses", () => {
      // Arrange
      const events = ["event:a", "event:b", "event:c"];
      const reqId = "req-order";

      // Act
      ok(mockSocket, events[0], { order: 1 }, reqId);
      err(mockSocket, events[1], "Error in B", reqId);
      ok(mockSocket, events[2], { order: 3 }, reqId);

      // Assert - Verifies emit order is maintained
      expect(mockSocket.emitCalls[0].event).toBe("event:a");
      expect(mockSocket.emitCalls[1].event).toBe("event:b");
      expect(mockSocket.emitCalls[2].event).toBe("event:c");

      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[1].data.success).toBe(false);
      expect(mockSocket.emitCalls[2].data.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle numeric requestId", () => {
      // Arrange
      const event = "test:numeric-id";
      const data = { value: 42 };
      const reqId = 12345;

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles numeric requestId
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.requestId).toBe(12345);
      expect(typeof emitData.requestId).toBe("number");
    });

    it("should handle special characters in event name", () => {
      // Arrange
      const event = "test:response!@#$%";
      const data = null;
      const reqId = "req-special-event";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles special characters in event name
      const emitCall = mockSocket._getLastEmit();
      expect(emitCall.event).toBe("test:response!@#$%");
    });

    it("should handle unicode in event name", () => {
      // Arrange
      const event = "test:响应-🚀";
      const data = null;
      const reqId = "req-unicode-event";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles unicode in event name
      const emitCall = mockSocket._getLastEmit();
      expect(emitCall.event).toBe("test:响应-🚀");
    });

    it("should handle very long event name", () => {
      // Arrange
      const event = "test:" + "x".repeat(500);
      const data = null;
      const reqId = "req-long-event";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles very long event name
      const emitCall = mockSocket._getLastEmit();
      expect(emitCall.event).toBe(event);
      expect(emitCall.event.length).toBeGreaterThan(500);
    });

    it("should handle zero as valid data", () => {
      // Arrange
      const event = "test:zero";
      const data = 0;
      const reqId = "req-zero";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles zero as valid data
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toBe(0);
      expect(emitData.data).not.toBeNull();
      expect(emitData.data).not.toBeUndefined();
    });

    it("should handle false as valid data", () => {
      // Arrange
      const event = "test:false";
      const data = false;
      const reqId = "req-false";

      // Act
      ok(mockSocket, event, data, reqId);

      // Assert - Verifies ok handles false as valid data
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.data).toBe(false);
      expect(emitData.data).not.toBeNull();
      expect(emitData.data).not.toBeUndefined();
    });

    it("should handle empty string as error message", () => {
      // Arrange
      const event = "test:empty-error";
      const message = "";
      const reqId = "req-empty-error";

      // Act
      err(mockSocket, event, message, reqId);

      // Assert - Verifies err handles empty string as error message
      const emitData = mockSocket._getLastEmit().data;
      expect(emitData.error.message).toBe("");
      expect(emitData.success).toBe(false);
    });
  });
});
