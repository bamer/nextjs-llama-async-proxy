import { GET, POST } from "@/app/api/models/[name]/analyze/route";
import {
  createMockRequest,
  createMockModel,
  setupDatabaseMocks,
} from "./models-analyze-route.test-utils";

describe("GET /api/models/:name/analyze - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 error when model name is missing", async () => {
    const response = await GET(createMockRequest(), {
      params: Promise.resolve({ name: "" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MODEL_NAME_REQUIRED");
  });

  it("should return 400 error when model name is null", async () => {
    const response = await GET(createMockRequest(), {
      params: Promise.resolve({ name: null as unknown as string }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("MODEL_NAME_REQUIRED");
  });

  it("should return 404 error when model is not found", async () => {
    const { getModels } = setupDatabaseMocks();
    getModels.mockReturnValue([]);

    const response = await GET(createMockRequest(), {
      params: Promise.resolve({ name: "nonexistent-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MODEL_NOT_FOUND");
  });

  it("should return 404 error when model has no id", async () => {
    const mockModel = { name: "model-without-id", model_path: "/models/test.gguf" };

    const { getModels } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const response = await GET(createMockRequest(), {
      params: Promise.resolve({ name: "model-without-id" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error.code).toBe("MODEL_NOT_FOUND");
  });

  it("should return 500 error when getModels throws", async () => {
    const { initDatabase } = setupDatabaseMocks();
    initDatabase.mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await GET(createMockRequest(), {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("GET_FIT_PARAMS_ERROR");
  });
});

describe("POST /api/models/:name/analyze - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 error when model name is missing", async () => {
    const response = await POST(createMockRequest(), {
      params: Promise.resolve({ name: "" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("MODEL_NAME_REQUIRED");
  });

  it("should return 404 error when model is not found", async () => {
    const { getModels } = setupDatabaseMocks();
    getModels.mockReturnValue([]);

    const response = await POST(createMockRequest(), {
      params: Promise.resolve({ name: "nonexistent-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error.code).toBe("MODEL_NOT_FOUND");
  });

  it("should return 400 error when model has no path", async () => {
    const mockModel = { id: 1, name: "model-without-path" };

    const { getModels } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const response = await POST(createMockRequest(), {
      params: Promise.resolve({ name: "model-without-path" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("NO_MODEL_PATH");
  });

  it("should return 500 error when analysis fails", async () => {
    const mockModel = createMockModel(1, "test-model", "/models/test.gguf");

    const { getModels, saveModelFitParams } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const { analyzeModel } = jest.mocked(require("@/server/services/fit-params-service"));
    analyzeModel.mockResolvedValue({
      success: false,
      error: "Analysis failed",
    });

    saveModelFitParams.mockReturnValue(1);

    const response = await POST(createMockRequest(), {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.fitParams.fit_params_error).toBe("Analysis failed");
    expect(json.data.fitParams.fit_params_success).toBe(0);
  });
});
