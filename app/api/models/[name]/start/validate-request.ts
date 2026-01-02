import { NextResponse } from "next/server";
import { startModelRequestSchema } from "@/lib/validators";
import { validateRequestBody } from "@/lib/validation-utils";

export interface ValidationErrorResponse {
  success: false;
  errorResponse: NextResponse;
}

export interface ValidationResult {
  success: true;
  selectedTemplate?: string;
}

export type ValidateResult = ValidationErrorResponse | ValidationResult;

/**
 * Validates the start model request
 * @param name - Model name from params
 * @param body - Request body
 * @returns Validation result with template or error response
 */
export function validateStartModelRequest(
  name: string,
  body: unknown
): ValidateResult {
  if (!name) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "Model name is required" },
        { status: 400 }
      ),
    };
  }

  // Add model name from params to body before validation
  const bodyWithModel = { model: name, ...(body as Record<string, unknown>) };

  // Validate request body with Zod
  const validation = validateRequestBody(startModelRequestSchema, bodyWithModel);
  if (!validation.success) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.errors,
        },
        { status: 400 }
      ),
    };
  }

  const template = validation.data?.template as string | undefined;
  const result: ValidationResult = { success: true };
  if (template !== undefined) {
    result.selectedTemplate = template;
  }
  return result;
}
