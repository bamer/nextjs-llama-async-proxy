/**
 * Tests for edge cases in model-templates API
 * File: app/api/model-templates/route.ts
 */

import { GET, POST } from "../../../app/api/model-templates/route";
import {
  fs,
  writeFileSync,
  validateRequestBody,
  validateConfig,
  createMockRequest,
} from "./route.shared-mocks";

const { readFile } = fs as jest.Mocked<typeof fs>;

describe("Edge Cases and Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET should handle file with unexpected fields", async () => {
    const mockTemplates = {
      model_templates: { "model1": "template1" },
      unexpected_field: "value",
      nested: { data: "here" },
    };
    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
      data: mockTemplates,
    });
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("POST should handle very large template data", async () => {
    const existingConfig = { model_templates: {}, default_model: null };
    const largeTemplates = Array.from({ length: 100 }, (_, i) => ({
      [`model${i}`]: `template${i}`.repeat(100),
    })).reduce(
      (acc, curr) => ({
        model_templates: { ...acc.model_templates, ...curr },
      }),
      { model_templates: {} }
    );
    const mockRequest = createMockRequest(largeTemplates);
    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: largeTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({ success: true });
    (writeFileSync as jest.Mock).mockReturnValueOnce(undefined);
    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
  });

  it("GET should handle file with only whitespace", async () => {
    (readFile as jest.Mock).mockResolvedValueOnce("   \n\t   ");
    const response = await GET();
    expect(response.status).toBe(500);
  });

  it("POST should handle concurrent requests", async () => {
    const existingConfig = { model_templates: {}, default_model: null };
    const newTemplates1 = { model_templates: { "model1": "template1" } };
    const newTemplates2 = { model_templates: { "model2": "template2" } };
    const mockRequest1 = createMockRequest(newTemplates1);
    const mockRequest2 = createMockRequest(newTemplates2);
    (readFile as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify(existingConfig))
      .mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock)
      .mockReturnValueOnce({ success: true, data: newTemplates1 })
      .mockReturnValueOnce({ success: true, data: newTemplates2 });
    (validateConfig as jest.Mock)
      .mockReturnValueOnce({ success: true })
      .mockReturnValueOnce({ success: true });
    (writeFileSync as jest.Mock)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined);
    const [response1, response2] = await Promise.all([
      POST(mockRequest1),
      POST(mockRequest2),
    ]);
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  it("POST should handle templates with special characters", async () => {
    const existingConfig = { model_templates: {}, default_model: null };
    const newTemplates = {
      model_templates: {
        "model with spaces": 'template with "quotes"',
        "model-with-dashes": "template-with-dashes",
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
    expect(response.status).toBe(200);
  });

  it("POST should handle unicode characters in templates", async () => {
    const existingConfig = { model_templates: {}, default_model: null };
    const newTemplates = {
      model_templates: {
        "模型": "テンプレート",
        "model": "🎯 template",
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
    expect(response.status).toBe(200);
  });

  it("POST should write file with proper JSON formatting", async () => {
    const existingConfig = { model_templates: {}, default_model: null };
    const newTemplates = { model_templates: { "model1": "template1" } };
    const mockRequest = createMockRequest(newTemplates);
    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConfig));
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({ success: true });
    (writeFileSync as jest.Mock).mockReturnValueOnce(undefined);
    await POST(mockRequest);
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("model-templates.json"),
      expect.stringMatching(/^\{[\s\S]*\}$/),
      "utf-8"
    );
  });
});
