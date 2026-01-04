describe("POST /api/model-templates - Save Success", () => {
  let mockConfigCache: any = null;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockConfigCache = null;

    const { getModelTemplatesConfig, updateModelTemplatesConfig, invalidateModelTemplatesCache } = 
      jest.mocked(require("@/lib/model-templates-config"));

    getModelTemplatesConfig.mockImplementation(() => {
      if (!mockConfigCache) {
        mockConfigCache = {};
      }
      return mockConfigCache;
    });

    updateModelTemplatesConfig.mockImplementation((updates: any) => {
      if (mockConfigCache) {
        mockConfigCache = { ...mockConfigCache, ...updates };
      } else {
        mockConfigCache = updates;
      }
    });

    invalidateModelTemplatesCache.mockImplementation(() => {
      mockConfigCache = null;
    });

    const fs = require("fs");
    fs.promises.readFile.mockResolvedValue(JSON.stringify({}));
    jest.mocked(require("@/lib/validation-utils")).validateRequestBody.mockReturnValue({ success: true, data: {} });
    jest.mocked(require("@/lib/validation-utils")).validateConfig.mockReturnValue({ success: true, data: {} });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should save model templates successfully", async () => {
    const requestBody = {
      model_templates: {
        "llama-2-7b": {
          ctx_size: 4096,
          gpu_layers: 35,
        },
      },
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    };

    jest.mocked(require("@/lib/validation-utils")).validateRequestBody.mockReturnValue({
      success: true,
      data: requestBody,
    });

    const { POST } = require("@/app/api/model-templates/route");
    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual(requestBody.model_templates);
  });

  it("should save empty model templates", async () => {
    const requestBody = {
      model_templates: {},
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    };

    jest.mocked(require("@/lib/validation-utils")).validateRequestBody.mockReturnValue({
      success: true,
      data: requestBody,
    });

    const { POST } = require("@/app/api/model-templates/route");
    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual({});
  });
});
