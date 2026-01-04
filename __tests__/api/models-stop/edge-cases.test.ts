import { POST as StopModel } from "../../app/api/models/[name]/stop/route";
import { NextRequest } from "next/server";
import { createMockRequest, createMockParams } from "./test-utils";

describe("POST /api/models/[name]/stop - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle very long model names", async () => {
    const longName = "a".repeat(10000);
    const mockRequest = createMockRequest();
    const mockParams = createMockParams(longName);

    const response = await StopModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe(longName);
  });

  it("should handle model names with unicode characters", async () => {
    const unicodeName = "llama-2-7b-日本語-中文-العربية";
    const mockRequest = createMockRequest();
    const mockParams = createMockParams(unicodeName);

    const response = await StopModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe(unicodeName);
  });

  it("should handle concurrent stop requests for same model", async () => {
    const mockRequest = createMockRequest();
    const mockParams = createMockParams("llama-2-7b");

    const responses = await Promise.all([
      StopModel(mockRequest, { params: mockParams }),
      StopModel(mockRequest, { params: mockParams }),
      StopModel(mockRequest, { params: mockParams }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it("should include all expected fields in success response", async () => {
    const mockRequest = createMockRequest();
    const mockParams = createMockParams("test-model");

    const response = await StopModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json).toHaveProperty("model");
    expect(_json).toHaveProperty("status");
    expect(_json).toHaveProperty("message");
    expect(_json).toHaveProperty("info");
  });
});
