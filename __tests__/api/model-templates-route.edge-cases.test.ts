describe("GET /api/model-templates - Edge Cases", () => {
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

  it("should handle concurrent GET requests", async () => {
    const mockCachedConfig = {
      model_templates: {},
      default_model: null,
    };

    mockConfigCache = mockCachedConfig;

    const { GET } = require("@/app/api/model-templates/route");
    const responses = await Promise.all([GET(), GET(), GET()]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it("should handle large model templates config", async () => {
    const largeTemplates = Array.from({ length: 100 }, (_, i) => ({
      [`model-${i}`]: {
        ctx_size: 4096,
        gpu_layers: 35,
      },
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    const mockCachedConfig = {
      model_templates: largeTemplates,
      default_model: "model-0",
    };

    mockConfigCache = mockCachedConfig;

    const { GET } = require("@/app/api/model-templates/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(json.data.model_templates)).toHaveLength(100);
  });
});

describe("POST /api/model-templates - Edge Cases", () => {
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

  it("should handle concurrent POST requests", async () => {
    const requestBody = {
      model_templates: {
        "test-model": {},
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
    const responses = await Promise.all([
      POST(mockRequest),
      POST(mockRequest),
      POST(mockRequest),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it("should handle very large template data", async () => {
    const largeTemplates = Array.from({ length: 1000 }, (_, i) => ({
      [`model-${i}`]: {
        ctx_size: 4096,
        gpu_layers: 35,
        custom: "x".repeat(100),
      },
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    const requestBody = {
      model_templates: largeTemplates,
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
    expect(Object.keys(json.data.model_templates)).toHaveLength(1000);
  });

  it("should handle template names with special characters", async () => {
    const requestBody = {
      model_templates: {
        "llama-2-7b-日本語-中文-العربية": {
          ctx_size: 4096,
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
    expect(json.data.model_templates).toHaveProperty(
      "llama-2-7b-日本語-中文-العربية"
    );
  });

  it("should handle deeply nested template config", async () => {
    const requestBody = {
      model_templates: {
        "test-model": {
          ctx_size: 4096,
          gpu_layers: 35,
          sampling: {
            temp: 0.7,
            top_p: 0.9,
            top_k: 40,
          },
          memory: {
            batch_size: 512,
            ubatch_size: 128,
          },
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
    expect(json.data.model_templates["test-model"].ctx_size).toBe(4096);
  });
});
