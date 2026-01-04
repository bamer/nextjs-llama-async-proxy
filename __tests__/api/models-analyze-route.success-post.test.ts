import { POST } from "@/app/api/models/[name]/analyze/route";
import {
  createMockRequest,
  createMockModel,
  createMockAnalysisResult,
  setupDatabaseMocks,
} from "./models-analyze-route.test-utils";

describe("POST /api/models/:name/analyze - Success Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully run fit-params analysis", async () => {
    const mockModel = createMockModel(1, "llama-2-7b", "/models/llama-2-7b.gguf");
    const mockAnalysisResult = createMockAnalysisResult();

    const { getModels, saveModelFitParams } = setupDatabaseMocks();
    getModels.mockReturnValue([mockModel]);

    const { analyzeModel } = jest.mocked(require("@/server/services/fit-params-service"));
    analyzeModel.mockResolvedValue(mockAnalysisResult);
    saveModelFitParams.mockReturnValue(1);

    const response = await POST(createMockRequest(), {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model).toEqual(mockModel);
    expect(json.data.fitParams.recommended_ctx_size).toBe(4096);
    expect(json.data.fitParams.recommended_gpu_layers).toBe(35);
    expect(analyzeModel).toHaveBeenCalledWith("/models/llama-2-7b.gguf");
    expect(saveModelFitParams).toHaveBeenCalled();
  });
});
