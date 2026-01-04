describe("GET /api/model-templates - Success Cases", () => {
  let mockConfigCache: any = null;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockConfigCache = null;

    const { getModelTemplatesConfig, updateModelTemplatesConfig, invalidateModelTemplatesCache } = 
      jest.mocked(require("@/lib/model-templates-config"));

    getModelTemplatesConfig.mockImplementation(() => mockConfigCache);
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

  it("should return cached config successfully", async () => {
    const mockCachedConfig = {
      model_templates: {
        "llama-2-7b": {
          ctx_size: 4096,
          gpu_layers: 35,
        },
      },
      default_model: "llama-2-7b",
    };

    mockConfigCache = mockCachedConfig;

    const { GET } = require("@/app/api/model-templates/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual(mockCachedConfig.model_templates);
    expect(json.data.default_model).toBe(mockCachedConfig.default_model);
  });

  it("should load config from disk on cache miss", async () => {
    const mockFileContent = {
      model_templates: {
        "mistral-7b": {
          ctx_size: 8192,
        },
      },
      default_model: "mistral-7b",
    };

    mockConfigCache = null;
    const fs = require("fs");
    fs.promises.readFile.mockResolvedValue(JSON.stringify(mockFileContent));
    jest.mocked(require("@/lib/validation-utils")).validateConfig.mockReturnValue({
      success: true,
      data: mockFileContent,
    });

    const { GET } = require("@/app/api/model-templates/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("should handle empty model templates", async () => {
    const mockCachedConfig = {
      model_templates: {},
      default_model: null,
    };

    mockConfigCache = mockCachedConfig;

    const { GET } = require("@/app/api/model-templates/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.model_templates).toEqual({});
    expect(json.data.default_model).toBeNull();
  });
});
