import { GET, POST } from "@/app/api/models/[name]/analyze/route";
import {
  createMockRequest,
  createMockModel,
  createMockFitParams,
  createMockAnalysisResult,
  setupDatabaseMocks,
} from "./models-analyze-route.test-utils";

describe("GET /api/models/:name/analyze - Success Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return fit-params data for existing model", async () => {
    const mockModel = createMockModel(1, "llama-2-7b", "/models/llama-2-7b.gguf");
    const mockFitParams = createMockFitParams(4096, 35);

    const { getModels, getModelFitParams } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);
    getModelFitParams.mockReturnValue(mockFitParams);

    const response = await GET(createMockRequest(), {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model).toEqual(mockModel);
    expect(json.data.fitParams).toEqual(mockFitParams);
  });

  it("should return null fitParams when model has no analysis", async () => {
    const mockModel = createMockModel(1, "test-model", "/models/test.gguf");

    const { getModels, getModelFitParams } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);
    getModelFitParams.mockReturnValue(null);

    const response = await GET(createMockRequest(), {
      params: Promise.resolve({ name: "test-model" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.fitParams).toBe(null);
  });
});
