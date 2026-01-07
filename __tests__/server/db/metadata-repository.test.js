/**
 * Metadata Repository Tests
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";

describe("MetadataRepository", () => {
  let MetadataRepository;
  let repository;
  let mockDb;
  let mockPrepare;
  let mockRun;
  let mockGet;

  beforeAll(async () => {
    const module = await import("../../../server/db/metadata-repository.js");
    MetadataRepository = module.MetadataRepository;
  });

  beforeEach(() => {
    mockRun = jest.fn();
    mockGet = jest.fn();
    mockPrepare = jest.fn().mockReturnValue({
      run: mockRun,
      get: mockGet,
    });
    mockDb = {
      prepare: mockPrepare,
    };
    repository = new MetadataRepository(mockDb);
  });

  describe("constructor", () => {
    it("should have MetadataRepository defined", () => {
      expect(MetadataRepository).toBeDefined();
    });

    it("should create repository instance with db", () => {
      expect(repository).toBeDefined();
      expect(repository.db).toBe(mockDb);
    });
  });

  describe("get()", () => {
    describe("positive tests - correct functionality", () => {
      it("should return defaultValue when key not found", () => {
        // Arrange: No saved value in database
        mockGet.mockReturnValue(undefined);

        // Act
        const result = repository.get("nonExistentKey", "default");

        // Assert: Should return default value
        expect(result).toBe("default");
        expect(mockPrepare).toHaveBeenCalledWith("SELECT value FROM metadata WHERE key = ?");
        expect(mockGet).toHaveBeenCalledWith("nonExistentKey");
      });

      it("should return null as default when key not found", () => {
        // Arrange: No saved value in database
        mockGet.mockReturnValue(undefined);

        // Act
        const result = repository.get("nonExistentKey");

        // Assert: Should return null (default defaultValue)
        expect(result).toBeNull();
      });

      it("should return stored string value when key exists", () => {
        // Arrange: Database has stored string value
        const storedValue = "hello world";
        mockGet.mockReturnValue({ value: JSON.stringify(storedValue) });

        // Act
        const result = repository.get("stringKey");

        // Assert: Should return parsed string
        expect(result).toBe(storedValue);
      });

      it("should return stored number value when key exists", () => {
        // Arrange: Database has stored number value
        const storedValue = 42.5;
        mockGet.mockReturnValue({ value: JSON.stringify(storedValue) });

        // Act
        const result = repository.get("numberKey");

        // Assert: Should return parsed number
        expect(result).toBe(storedValue);
        expect(typeof result).toBe("number");
      });

      it("should return stored boolean value when key exists", () => {
        // Arrange: Database has stored boolean value
        const storedValue = true;
        mockGet.mockReturnValue({ value: JSON.stringify(storedValue) });

        // Act
        const result = repository.get("booleanKey");

        // Assert: Should return parsed boolean
        expect(result).toBe(storedValue);
        expect(typeof result).toBe("boolean");
      });

      it("should return stored false boolean correctly", () => {
        // Arrange: Database has stored false value
        const storedValue = false;
        mockGet.mockReturnValue({ value: JSON.stringify(storedValue) });

        // Act
        const result = repository.get("booleanKey");

        // Assert: Should return false (not falsy undefined)
        expect(result).toBe(false);
        expect(result).not.toBeNull();
      });

      it("should return stored array value when key exists", () => {
        // Arrange: Database has stored array value
        const storedValue = [1, 2, 3, "four", true];
        mockGet.mockReturnValue({ value: JSON.stringify(storedValue) });

        // Act
        const result = repository.get("arrayKey");

        // Assert: Should return parsed array with all elements
        expect(result).toEqual(storedValue);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(5);
      });

      it("should return stored object value when key exists", () => {
        // Arrange: Database has stored object value
        const storedValue = { name: "test", value: 123 };
        mockGet.mockReturnValue({ value: JSON.stringify(storedValue) });

        // Act
        const result = repository.get("objectKey");

        // Assert: Should return parsed object
        expect(result).toEqual(storedValue);
        expect(typeof result).toBe("object");
        expect(result.name).toBe("test");
        expect(result.value).toBe(123);
      });

      it("should return stored null value when key exists", () => {
        // Arrange: Database has stored null value
        mockGet.mockReturnValue({ value: JSON.stringify(null) });

        // Act
        const result = repository.get("nullKey");

        // Assert: Should return null
        expect(result).toBeNull();
      });

      it("should return stored zero value correctly", () => {
        // Arrange: Database has stored zero value
        mockGet.mockReturnValue({ value: JSON.stringify(0) });

        // Act
        const result = repository.get("zeroKey");

        // Assert: Should return 0 (not falsy default)
        expect(result).toBe(0);
        expect(result).not.toBeNull();
      });

      it("should return stored empty string correctly", () => {
        // Arrange: Database has stored empty string
        mockGet.mockReturnValue({ value: JSON.stringify("") });

        // Act
        const result = repository.get("emptyStringKey");

        // Assert: Should return empty string (not falsy default)
        expect(result).toBe("");
        expect(result).not.toBeNull();
      });

      it("should return stored empty array correctly", () => {
        // Arrange: Database has stored empty array
        mockGet.mockReturnValue({ value: JSON.stringify([]) });

        // Act
        const result = repository.get("emptyArrayKey");

        // Assert: Should return empty array (not falsy default)
        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      it("should return stored empty object correctly", () => {
        // Arrange: Database has stored empty object
        mockGet.mockReturnValue({ value: JSON.stringify({}) });

        // Act
        const result = repository.get("emptyObjectKey");

        // Assert: Should return empty object
        expect(result).toEqual({});
        expect(typeof result).toBe("object");
      });

      it("should return custom defaultValue when key not found", () => {
        // Arrange: No saved value in database
        mockGet.mockReturnValue(undefined);

        // Act
        const result = repository.get("missingKey", { custom: "default" });

        // Assert: Should return custom default
        expect(result).toEqual({ custom: "default" });
      });

      it("should return number default when key not found", () => {
        // Arrange: No saved value in database
        mockGet.mockReturnValue(undefined);

        // Act
        const result = repository.get("missingKey", 999);

        // Assert: Should return number default
        expect(result).toBe(999);
      });

      it("should return array default when key not found", () => {
        // Arrange: No saved value in database
        mockGet.mockReturnValue(undefined);

        // Act
        const result = repository.get("missingKey", ["a", "b"]);

        // Assert: Should return array default
        expect(result).toEqual(["a", "b"]);
      });
    });

    describe("negative tests - error handling", () => {
      it("should return defaultValue when JSON parse fails", () => {
        // Arrange: Database returns invalid JSON
        mockGet.mockReturnValue({ value: "not valid json{" });

        // Act
        const result = repository.get("corruptKey", "fallback");

        // Assert: Should return default value (not crash)
        expect(result).toBe("fallback");
      });

      it("should return defaultValue when JSON parse throws error", () => {
        // Arrange: JSON.parse throws an error with malformed JSON
        mockGet.mockReturnValue({ value: '{ "incomplete": json' });

        // Act
        const result = repository.get("malformedKey", { error: "handled" });

        // Assert: Should return default value (not crash)
        expect(result).toEqual({ error: "handled" });
      });

      it("should return defaultValue when database query throws error", () => {
        // Arrange: Database query throws an error
        mockGet.mockImplementation(() => {
          throw new Error("Database error");
        });

        // Act
        const result = repository.get("errorKey", "default");

        // Assert: Should return default value (not crash)
        expect(result).toBe("default");
      });

      it("should return defaultValue when value is undefined in result", () => {
        // Arrange: Query returns result without value property
        mockGet.mockReturnValue({});

        // Act
        const result = repository.get("missingValueKey", "default");

        // Assert: Should return default value (not crash)
        expect(result).toBe("default");
      });

      it("should return defaultValue when result is null", () => {
        // Arrange: Query returns null
        mockGet.mockReturnValue(null);

        // Act
        const result = repository.get("nullResultKey", "default");

        // Assert: Should return default value (not crash)
        expect(result).toBe("default");
      });

      it("should handle JSON.stringify limitations with NaN/Infinity", () => {
        // Arrange: JSON.stringify converts NaN, Infinity, -Infinity to null
        const specialObj = { NaNValue: NaN, InfinityValue: Infinity, negInfinityValue: -Infinity };
        const jsonString = JSON.stringify(specialObj);
        mockGet.mockReturnValue({ value: jsonString });

        // Act
        const result = repository.get("specialJsonKey", {});

        // Assert: JSON.stringify converts these to null
        expect(result.NaNValue).toBeNull();
        expect(result.InfinityValue).toBeNull();
        expect(result.negInfinityValue).toBeNull();
      });
    });
  });

  describe("set()", () => {
    describe("positive tests - correct functionality", () => {
      it("should store string value as JSON", () => {
        // Arrange
        const key = "stringKey";
        const value = "test string";

        // Act
        repository.set(key, value);

        // Assert: Should call prepare with correct query and stringify value
        expect(mockPrepare).toHaveBeenCalledWith(
          "INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)"
        );
        expect(mockRun).toHaveBeenCalledWith(key, JSON.stringify(value), expect.any(Number));
      });

      it("should store number value as JSON", () => {
        // Arrange
        const key = "numberKey";
        const value = 123.45;

        // Act
        repository.set(key, value);

        // Assert: Should stringify number
        expect(mockRun).toHaveBeenCalledWith(key, JSON.stringify(value), expect.any(Number));
        expect(JSON.parse(mockRun.mock.calls[0][1])).toBe(123.45);
      });

      it("should store boolean value as JSON", () => {
        // Arrange
        const key = "booleanKey";
        const value = true;

        // Act
        repository.set(key, value);

        // Assert: Should stringify boolean
        expect(mockRun).toHaveBeenCalledWith(key, JSON.stringify(value), expect.any(Number));
        expect(JSON.parse(mockRun.mock.calls[0][1])).toBe(true);
      });

      it("should store array value as JSON", () => {
        // Arrange
        const key = "arrayKey";
        const value = [1, 2, 3, "test", { nested: true }];

        // Act
        repository.set(key, value);

        // Assert: Should stringify array
        const savedJson = JSON.parse(mockRun.mock.calls[0][1]);
        expect(savedJson).toEqual(value);
        expect(Array.isArray(savedJson)).toBe(true);
      });

      it("should store object value as JSON", () => {
        // Arrange
        const key = "objectKey";
        const value = { name: "test", nested: { deep: "value" } };

        // Act
        repository.set(key, value);

        // Assert: Should stringify object
        const savedJson = JSON.parse(mockRun.mock.calls[0][1]);
        expect(savedJson).toEqual(value);
        expect(savedJson.nested.deep).toBe("value");
      });

      it("should update existing key with new value", () => {
        // Arrange: Set key first time
        const key = "updateKey";
        repository.set(key, "first value");

        // Verify first set
        expect(mockRun).toHaveBeenCalledTimes(1);

        // Act: Set same key with new value
        repository.set(key, "second value");

        // Assert: Should have called run twice with new value
        expect(mockRun).toHaveBeenCalledTimes(2);
        expect(JSON.parse(mockRun.mock.calls[1][1])).toBe("second value");
      });

      it("should store empty object as JSON", () => {
        // Arrange
        const key = "emptyObjectKey";
        const value = {};

        // Act
        repository.set(key, value);

        // Assert: Should store empty object
        expect(mockRun).toHaveBeenCalledWith(key, "{}", expect.any(Number));
      });

      it("should store empty array as JSON", () => {
        // Arrange
        const key = "emptyArrayKey";
        const value = [];

        // Act
        repository.set(key, value);

        // Assert: Should store empty array
        expect(mockRun).toHaveBeenCalledWith(key, "[]", expect.any(Number));
      });

      it("should store complex nested objects", () => {
        // Arrange
        const key = "complexKey";
        const value = {
          level1: {
            level2: {
              level3: {
                array: [1, 2, { deep: "value" }],
                boolean: true,
                null: null,
                number: 42,
              },
            },
          },
        };

        // Act
        repository.set(key, value);

        // Assert: Should properly stringify nested objects
        const savedJson = JSON.parse(mockRun.mock.calls[0][1]);
        expect(savedJson).toEqual(value);
        expect(savedJson.level1.level2.level3.array[2].deep).toBe("value");
      });

      it("should store null value as empty object", () => {
        // Arrange
        const key = "nullKey";
        const value = null;

        // Act
        repository.set(key, value);

        // Assert: Should store empty object string
        expect(mockRun).toHaveBeenCalledWith(key, "{}", expect.any(Number));
      });

      it("should store undefined value as empty object", () => {
        // Arrange
        const key = "undefinedKey";
        const value = undefined;

        // Act
        repository.set(key, value);

        // Assert: Should store empty object string
        expect(mockRun).toHaveBeenCalledWith(key, "{}", expect.any(Number));
      });

      it("should include updated_at timestamp", () => {
        // Arrange
        const key = "timestampKey";
        const beforeTime = Math.floor(Date.now() / 1000);

        // Act
        repository.set(key, "value");

        // Assert: Should include timestamp
        const timestamp = mockRun.mock.calls[0][2];
        expect(typeof timestamp).toBe("number");
        expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      });

      it("should handle special characters in string values", () => {
        // Arrange
        const key = "specialCharsKey";
        const value = 'String with "quotes" and \\ backslash and \n newline';

        // Act
        repository.set(key, value);

        // Assert: Should properly JSON stringify special characters
        expect(mockRun.mock.calls[0][1]).toBe(JSON.stringify(value));
      });

      it("should handle unicode characters", () => {
        // Arrange
        const key = "unicodeKey";
        const value = "Hello 世界 🌍 Привет";

        // Act
        repository.set(key, value);

        // Assert: Should properly stringify unicode
        expect(mockRun.mock.calls[0][1]).toBe(JSON.stringify(value));
      });

      it("should store zero value correctly", () => {
        // Arrange
        const key = "zeroKey";
        const value = 0;

        // Act
        repository.set(key, value);

        // Assert: Should store zero (not skip)
        expect(JSON.parse(mockRun.mock.calls[0][1])).toBe(0);
      });

      it("should store false boolean correctly", () => {
        // Arrange
        const key = "falseKey";
        const value = false;

        // Act
        repository.set(key, value);

        // Assert: Should store false (not skip)
        expect(JSON.parse(mockRun.mock.calls[0][1])).toBe(false);
      });

      it("should store empty string correctly", () => {
        // Arrange
        const key = "emptyStringKey";
        const value = "";

        // Act
        repository.set(key, value);

        // Assert: Should store empty string
        expect(mockRun.mock.calls[0][1]).toBe('""');
      });
    });

    describe("negative tests - error handling", () => {
      it("should handle database error on set", () => {
        // Arrange: Database throws on run
        mockRun.mockImplementation(() => {
          throw new Error("Database write error");
        });

        // Act & Assert: Should propagate database error
        expect(() => {
          repository.set("errorKey", "value");
        }).toThrow("Database write error");
      });

      it("should handle prepare error", () => {
        // Arrange: Prepare throws error
        mockPrepare.mockImplementation(() => {
          throw new Error("Prepare error");
        });

        // Act & Assert: Should propagate prepare error
        expect(() => {
          repository.set("errorKey", "value");
        }).toThrow("Prepare error");
      });
    });
  });

  describe("integration scenarios", () => {
    it("should round-trip string values correctly", () => {
      // Arrange
      const key = "stringTest";
      const originalValue = "Hello World";

      // Act: Set value
      repository.set(key, originalValue);

      // Simulate database returning what was stored
      mockGet.mockReturnValue({ value: JSON.stringify(originalValue) });

      // Act: Get value
      const retrievedValue = repository.get(key);

      // Assert: Should match original
      expect(retrievedValue).toBe(originalValue);
    });

    it("should round-trip object values correctly", () => {
      // Arrange
      const key = "objectTest";
      const originalValue = { nested: { deep: "value" }, array: [1, 2, 3] };

      // Act: Set value
      repository.set(key, originalValue);

      // Simulate database returning what was stored
      mockGet.mockReturnValue({ value: JSON.stringify(originalValue) });

      // Act: Get value
      const retrievedValue = repository.get(key);

      // Assert: Should match original
      expect(retrievedValue).toEqual(originalValue);
      expect(retrievedValue.nested.deep).toBe("value");
      expect(retrievedValue.array).toEqual([1, 2, 3]);
    });

    it("should handle set then get with different types", () => {
      // Arrange & Act: Set string
      repository.set("key", "initial");

      // Simulate database returning string
      mockGet.mockReturnValue({ value: JSON.stringify("initial") });
      expect(repository.get("key")).toBe("initial");

      // Act: Set number
      repository.set("key", 123);

      // Simulate database returning number
      mockGet.mockReturnValue({ value: JSON.stringify(123) });
      expect(repository.get("key")).toBe(123);

      // Act: Set object
      repository.set("key", { data: "object" });

      // Simulate database returning object
      mockGet.mockReturnValue({ value: JSON.stringify({ data: "object" }) });
      expect(repository.get("key")).toEqual({ data: "object" });
    });

    it("should handle null then get returns null", () => {
      // Arrange: Set null
      repository.set("nullKey", null);

      // Simulate database returning null as JSON
      mockGet.mockReturnValue({ value: JSON.stringify(null) });

      // Act: Get value
      const result = repository.get("nullKey");

      // Assert: Should return null
      expect(result).toBeNull();
    });

    it("should handle undefined then get returns default", () => {
      // Arrange: Set undefined
      repository.set("undefinedKey", undefined);

      // Simulate database returning empty object (what null/undefined becomes)
      mockGet.mockReturnValue({ value: "{}" });

      // Act: Get value with custom default
      const result = repository.get("undefinedKey", "myDefault");

      // Assert: Should return default (JSON.parse of {} returns {})
      expect(result).toEqual({});
    });
  });
});
