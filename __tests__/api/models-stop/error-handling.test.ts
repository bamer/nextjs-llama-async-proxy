import { POST as StopModel } from "../../app/api/models/[name]/stop/route";
import { NextRequest } from "next/server";
import { createMockRequest, createMockParams, createEmptyParams, createRejectedParams } from "./test-utils";

describe("POST /api/models/[name]/stop - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 500 error on unexpected errors", async () => {
    const mockParams = createRejectedParams("Unexpected error");
    const mockRequest = createMockRequest();

    const response = await StopModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json).toMatchObject({
      error: "Internal server error",
      status: "error",
    });
  });

  it("should log appropriate messages when stopping model", async () => {
    const mockRequest = createMockRequest();
    const mockParams = createMockParams("llama-3-8b");

    await StopModel(mockRequest, { params: mockParams });

    expect(console.log).toHaveBeenCalledWith("[API] Stopping model: llama-3-8b");
    expect(console.log).toHaveBeenCalledWith(
      "[API] Note: llama.cpp does not support explicit model unloading"
    );
  });

  it("should handle empty model name gracefully", async () => {
    const mockRequest = createMockRequest();
    const mockParams = createEmptyParams();

    const response = await StopModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json).toEqual({
      error: "Model name is required",
    });
  });
});
