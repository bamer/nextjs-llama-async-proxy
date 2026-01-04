import { POST as StopModel } from "../../app/api/models/[name]/stop/route";
import { NextRequest } from "next/server";
import { createMockRequest, createMockParams, createEmptyParams, createRejectedParams } from "./test-utils";

describe("POST /api/models/[name]/stop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return success response when stopping a model", async () => {
    const mockRequest = createMockRequest();
    const mockParams = createMockParams("llama-2-7b");

    const response = await StopModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json).toMatchObject({
      model: "llama-2-7b",
      status: "note",
      message:
        "llama.cpp auto-manages model memory. The model will be unloaded when you load a different one.",
      info: "To completely free memory, restart llama-server process.",
    });
    expect(console.log).toHaveBeenCalledWith("[API] Stopping model: llama-2-7b");
  });

  it("should return 400 error when model name is missing", async () => {
    const mockRequest = createMockRequest();
    const mockParams = createEmptyParams();

    const response = await StopModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json).toEqual({
      error: "Model name is required",
    });
  });

  it("should handle model names with special characters", async () => {
    const mockRequest = createMockRequest();
    const mockParams = createMockParams("llama-2-7b-v2-test");

    const response = await StopModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe("llama-2-7b-v2-test");
  });

  it("should return informative message about auto-managed memory", async () => {
    const mockRequest = createMockRequest();
    const mockParams = createMockParams("mistral-7b");

    const response = await StopModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.status).toBe("note");
    expect(_json.message).toContain("auto-manages model memory");
    expect(_json.info).toContain("restart llama-server process");
  });
});
