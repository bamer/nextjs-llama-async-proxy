import { POST as StopModel } from "../../app/api/models/[name]/stop/route";
import { NextRequest } from "next/server";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

describe("POST /api/models/[name]/stop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Positive test: Return successful response for stopping a model
  it("should return success response when stopping a model", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      model: "llama-2-7b",
      status: "note",
      message:
        "llama.cpp auto-manages model memory. The model will be unloaded when you load a different one.",
      info: "To completely free memory, restart the llama-server process.",
    });
    expect(console.log).toHaveBeenCalledWith("[API] Stopping model: llama-2-7b");
  });

  // Negative test: Return 400 when model name is missing
  it("should return 400 error when model name is missing", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "" });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Model name is required",
    });
  });

  // Positive test: Handle model names with special characters
  it("should handle model names with special characters", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "llama-2-7b-v2-test" });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe("llama-2-7b-v2-test");
  });

  // Positive test: Return informative message about llama.cpp behavior
  it("should return informative message about auto-managed memory", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "mistral-7b" });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("note");
    expect(json.message).toContain("auto-manages model memory");
    expect(json.info).toContain("restart the llama-server process");
  });

  // Negative test: Handle unexpected errors
  it("should return 500 error on unexpected errors", async () => {
    const mockParams = Promise.reject(new Error("Unexpected error"));

    const mockRequest = {} as unknown as NextRequest;

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toMatchObject({
      error: "Internal server error",
      status: "error",
    });
  });

  // Positive test: Log appropriate messages
  it("should log appropriate messages when stopping model", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "llama-3-8b" });

    await StopModel(mockRequest, { params: mockParams });

    expect(console.log).toHaveBeenCalledWith("[API] Stopping model: llama-3-8b");
    expect(console.log).toHaveBeenCalledWith(
      "[API] Note: llama.cpp does not support explicit model unloading"
    );
  });

  // Positive test: Handle different model formats
  it("should handle various model name formats", async () => {
    const modelNames = [
      "llama-2-7b",
      "mistral-7b-instruct",
      "gemma-7b",
      "phi-3-mini",
    ];

    for (const name of modelNames) {
      const mockRequest = {} as unknown as NextRequest;
      const mockParams = Promise.resolve({ name });

      const response = await StopModel(mockRequest, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.model).toBe(name);
    }
  });

  // Negative test: Handle empty model name
  it("should handle empty model name gracefully", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "" });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Model name is required",
    });
  });

  // Edge case: Handle very long model names
  it("should handle very long model names", async () => {
    const longName = "a".repeat(10000);
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: longName });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe(longName);
  });

  // Edge case: Handle model names with unicode characters
  it("should handle model names with unicode characters", async () => {
    const unicodeName = "llama-2-7b-日本語-中文-العربية";
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: unicodeName });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe(unicodeName);
  });

  // Edge case: Handle concurrent stop requests for same model
  it("should handle concurrent stop requests", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const responses = await Promise.all([
      StopModel(mockRequest, { params: mockParams }),
      StopModel(mockRequest, { params: mockParams }),
      StopModel(mockRequest, { params: mockParams }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle model names with path-like characters
  it("should handle model names with path-like characters", async () => {
    const pathName = "../../models/test-model";
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: pathName });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe(pathName);
  });

  // Edge case: Handle model names with SQL-like patterns
  it("should handle model names with SQL-like patterns", async () => {
    const sqlName = "model'; DROP TABLE models; --";
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: sqlName });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe(sqlName);
  });

  // Edge case: Handle model names with emoji
  it("should handle model names with emoji", async () => {
    const emojiName = "llama-2-7b-🦙🚀✨";
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: emojiName });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe(emojiName);
  });

  // Edge case: Handle model name with null bytes
  it("should handle model name with special null characters", async () => {
    const specialName = "model\x00test";
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: specialName });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe(specialName);
  });

  // Edge case: Handle params that reject instead of resolve
  it("should handle params promise rejection", async () => {
    const mockParams = Promise.reject(new Error("Param error"));
    const mockRequest = {} as unknown as NextRequest;

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toMatchObject({
      error: "Internal server error",
      status: "error",
    });
  });

  // Edge case: Handle model name with whitespace only
  it("should handle model name with only whitespace", async () => {
    const whitespaceName = "   \t\n  ";
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: whitespaceName });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    // Should be considered a valid name (non-empty string)
    expect(response.status).toBe(200);
    expect(json.model).toBe(whitespaceName);
  });

  // Edge case: Handle model name with URL encoding characters
  it("should handle model names with URL-encoded characters", async () => {
    const urlName = "model%20name%20with%20spaces";
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: urlName });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe(urlName);
  });

  // Edge case: Verify response contains all expected fields
  it("should include all expected fields in success response", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "test-model" });

    const response = await StopModel(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty("model");
    expect(json).toHaveProperty("status");
    expect(json).toHaveProperty("message");
    expect(json).toHaveProperty("info");
  });
});
