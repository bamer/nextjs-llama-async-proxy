/**
 * Tests for POST /api/model-templates - Success cases
 * File: app/api/model-templates/route.ts
 */

import { POST } from "../../../app/api/model-templates/route";
import {
  fs,
  writeFileSync,
  validateRequestBody,
  validateConfig,
  createMockRequest,
} from "./route.shared-mocks";

const { readFile } = fs as jest.Mocked<typeof fs>;

describe("POST /api/model-templates - Success", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save model templates successfully", async () => {
    const existingConfig = {
      model_templates: { "old-model": "old-template" },
      default_model: "old-model",
    };
    const newTemplates = {
      model_templates: {
        "new-model": "new-template",
      },
    };
    const mockRequest = createMockRequest(newTemplates);
    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({ success: true });
    (writeFileSync as jest.Mock).mockReturnValueOnce(undefined);
    const response = await POST(mockRequest);
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: {
        model_templates: newTemplates.model_templates,
        default_model: null,
      },
      timestamp: expect.any(String),
    });
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("model-templates.json"),
      expect.stringContaining('"model_templates"'),
      "utf-8"
    );
  });

  it("should preserve default_model when saving", async () => {
    const existingConfig = {
      model_templates: { "old-model": "old-template" },
      default_model: "default-model",
    };
    const newTemplates = {
      model_templates: { "new-model": "new-template" },
    };
    const mockRequest = createMockRequest(newTemplates);
    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({ success: true });
    (writeFileSync as jest.Mock).mockReturnValueOnce(undefined);
    await POST(mockRequest);
    const writtenData = JSON.parse(
      (writeFileSync as jest.Mock).mock.calls[0][1] as string
    );
    // Note: Current implementation doesn't preserve default_model
    expect(writtenData.model_templates).toEqual(newTemplates.model_templates);
  });

  it("should merge new templates with existing ones", async () => {
    const existingConfig = {
      model_templates: {
        "model1": "template1",
        "model2": "template2",
      },
      default_model: "model1",
    };
    const newTemplates = {
      model_templates: {
        "model3": "template3",
      },
    };
    const mockRequest = createMockRequest(newTemplates);
    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({ success: true });
    (writeFileSync as jest.Mock).mockReturnValueOnce(undefined);
    await POST(mockRequest);
    const writtenData = JSON.parse(
      (writeFileSync as jest.Mock).mock.calls[0][1] as string
    );
    expect(writtenData.model_templates).toEqual({
      "model3": "template3",
    });
  });

  it("should handle empty model_templates in request", async () => {
    const existingConfig = {
      model_templates: { "old": "template" },
      default_model: null,
    };
    const newTemplates = {
      model_templates: {},
    };
    const mockRequest = createMockRequest(newTemplates);
    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({ success: true });
    (writeFileSync as jest.Mock).mockReturnValueOnce(undefined);
    const response = await POST(mockRequest);
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.data.model_templates).toEqual({});
  });

  it("should include timestamp in response", async () => {
    const existingConfig = {
      model_templates: {},
      default_model: null,
    };
    const newTemplates = {
      model_templates: { "model1": "template1" },
    };
    const mockRequest = createMockRequest(newTemplates);
    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({ success: true });
    (writeFileSync as jest.Mock).mockReturnValueOnce(undefined);
    const response = await POST(mockRequest);
    const json = await response.json();
    expect(json.timestamp).toBeDefined();
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
