import { POST } from "../../app/api/models/[name]/stop/route";
import { NextRequest } from "next/server";
import { validateRequestBody } from "@/lib/validation-utils";
import { stopModelRequestSchema } from "@/lib/validators";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/validation-utils");

describe("POST /api/models/:name/stop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Successfully stop model (returns info message)
  it("should return info about model unloading", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: false },
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.status).toBe("note");
    expect(_json.message).toContain("llama.cpp auto-manages model memory");
    expect(_json.info).toContain("restart the llama-server process");
  });

  // Positive test: Stop model with force=true
  it("should handle force=true parameter", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ force: true }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: true },
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.message).toContain("auto-manages model memory");
  });

  // Positive test: Stop model with force=false
  it("should handle force=false parameter", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ force: false }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: false },
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Positive test: Stop model without force in body
  it("should handle missing force in body", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: undefined },
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Negative test: Return 400 when model name is missing
  it("should return 400 error when model name is missing", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: false },
    });

    const mockParams = Promise.resolve({ name: "" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json.error).toBe("Model name is required");
  });

  // Negative test: Return 400 when model name is null
  it("should return 400 error when model name is null", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: false },
    });

    const mockParams = Promise.resolve({ name: null as unknown as string });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json.error).toBe("Model name is required");
  });

  // Negative test: Return 400 when validation fails
  it("should return 400 error when validation fails", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: [{ path: ["force"], message: "Invalid force value" }],
    });

    const mockParams = Promise.resolve({ name: "test-model" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json.error).toBe("Invalid request body");
    expect(_json.details).toBeDefined();
  });

  // Edge case: Handle invalid JSON in request body
  it("should handle invalid JSON in request body", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: ["Invalid request body"],
    });

    const mockParams = Promise.resolve({ name: "test-model" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json.error).toBe("Invalid request body");
  });

  // Edge case: Handle concurrent stop requests
  it("should handle concurrent stop requests", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: false },
    });

    const mockParams = Promise.resolve({ name: "test-model" });

    const responses = await Promise.all([
      POST(mockRequest, { params: mockParams }),
      POST(mockRequest, { params: mockParams }),
      POST(mockRequest, { params: mockParams }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle model name with special characters
  it("should handle model name with special characters", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: false },
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b-日本語-中文" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe("llama-2-7b-日本語-中文");
  });

  // Edge case: Handle very long model name
  it("should handle very long model name", async () => {
    const longName = "a".repeat(1000);

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: false },
    });

    const mockParams = Promise.resolve({ name: longName });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe(longName);
  });

  // Edge case: Handle model name with emoji
  it("should handle model name with emoji", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: false },
    });

    const mockParams = Promise.resolve({ name: "🦙-llama-2-7b-🚀" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe("🦙-llama-2-7b-🚀");
  });

  // Edge case: Handle empty request body
  it("should handle empty request body", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const mockParams = Promise.resolve({ name: "test-model" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle body with extra properties
  it("should handle body with extra properties", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        force: true,
        extra: "property",
        another: "value",
      }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { force: true },
    });

    const mockParams = Promise.resolve({ name: "test-model" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
  });
});
