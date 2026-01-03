/**
 * Tests for Zod validation integration
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

describe("Zod Validation Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET should validate against modelTemplatesConfigSchema", async () => {
    const mockTemplates = {
      model_templates: { "model1": "template1" },
      default_model: "model1",
    };
    (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTemplates));
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: true,
      data: mockTemplates,
    });
    await GET();
    expect(validateConfig).toHaveBeenCalledWith(
      expect.anything(),
      mockTemplates,
      "model-templates"
    );
  });

  it("POST should validate against modelTemplateSaveRequestSchema", async () => {
    const newTemplates = { model_templates: { "model1": "template1" } };
    const mockRequest = createMockRequest(newTemplates);
    (readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ model_templates: {}, default_model: null })
    );
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: true,
      data: newTemplates,
    });
    (validateConfig as jest.Mock).mockReturnValueOnce({ success: true });
    (writeFileSync as jest.Mock).mockReturnValueOnce(undefined);
    await POST(mockRequest);
    expect(validateRequestBody).toHaveBeenCalledWith(
      expect.anything(),
      newTemplates
    );
  });

  it("GET should return 200 with empty templates when schema fails", async () => {
    const invalidTemplates = { invalid: "structure" };
    (readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(invalidTemplates)
    );
    (validateConfig as jest.Mock).mockReturnValueOnce({
      success: false,
      errors: ["Missing model_templates field"],
    });
    const response = await GET();
    const json = await response.json();
    // Returns 200 with empty templates on validation failure (by design)
    expect(response.status).toBe(200);
    expect(json.data.model_templates).toEqual({});
  });

  it("POST should return validation errors when schema fails", async () => {
    const invalidBody = { invalid: "data" };
    const mockRequest = createMockRequest(invalidBody);
    (validateRequestBody as jest.Mock).mockReturnValueOnce({
      success: false,
      errors: [
        "Missing model_templates field",
        "model_templates must be an object",
      ],
    });
    const response = await POST(mockRequest);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.details).toBeDefined();
  });
});
