describe("GET /api/model-templates - Error Handling", () => {
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

  it("should return default templates when validation fails", async () => {
    const mockFileContent = {
      invalid: "data",
    };

    mockConfigCache = null;
    const fs = require("fs");
    fs.promises.readFile.mockResolvedValue(JSON.stringify(mockFileContent));
    jest.mocked(require("@/lib/validation-utils")).validateConfig.mockReturnValue({
      success: false,
      errors: [{ path: [], message: "Invalid config" }],
    });

    const { GET } = require("@/app/api/model-templates/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.model_templates).toEqual({});
    expect(json.data.default_model).toBeNull();
  });

  it("should return 500 error when file read fails", async () => {
    mockConfigCache = null;
    const fs = require("fs");
    fs.promises.readFile.mockRejectedValue(new Error("File not found"));

    const { GET } = require("@/app/api/model-templates/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to load model templates");
  });
});

describe("POST /api/model-templates - Error Handling", () => {
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

  it("should return 400 error when validation fails", async () => {
    const requestBody = {
      invalid: "data",
    };

    const mockRequest = {
      json: jest.fn().mockResolvedValue(requestBody),
    };

    jest.mocked(require("@/lib/validation-utils")).validateRequestBody.mockReturnValue({
      success: false,
      errors: [
        { path: ["model_templates"], message: "Invalid templates" },
      ],
    });

    const { POST } = require("@/app/api/model-templates/route");
    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Invalid request body");
    expect(json.details).toBeDefined();
  });

  it("should return 500 error when save fails", async () => {
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

    const { updateModelTemplatesConfig } = require("@/lib/model-templates-config");
    jest.mocked(updateModelTemplatesConfig).mockImplementation(() => {
      throw new Error("Save failed");
    });

    const { POST } = require("@/app/api/model-templates/route");
    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to save model templates");
  });

  it("should handle invalid JSON in request", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    };

    const { POST } = require("@/app/api/model-templates/route");
    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to save model templates");
  });
});
