import { NextResponse, NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getLogger } from "@/lib/logger";
import { validateRequestBody, validateConfig } from "@/lib/validation-utils";
import { modelTemplatesConfigSchema, modelTemplateSaveRequestSchema } from "@/lib/validators";

const logger = getLogger();

// Path to model templates configuration file
const MODEL_TEMPLATES_PATH = path.join(
  process.cwd(),
  "src/config/model-templates.json"
);

/**
 * GET /api/model-templates
 * Load and return model templates configuration
 */
export async function GET(): Promise<NextResponse> {
  try {
    logger.info("[API] Fetching model templates configuration");

    // Read model templates file
    const fileContent = await fs.readFile(MODEL_TEMPLATES_PATH, "utf-8");
    const templatesData = JSON.parse(fileContent);

    // Validate with Zod schema
    const validation = validateConfig(
      modelTemplatesConfigSchema,
      templatesData,
      "model-templates"
    );

    if (!validation.success) {
      logger.error(
        "[API] Model templates validation failed:",
        validation.errors
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid model templates configuration",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    logger.info("[API] Model templates loaded successfully");
    return NextResponse.json({
      success: true,
      data: {
        model_templates: validation.data?.model_templates || {},
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[API] Error loading model templates:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load model templates",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/model-templates
 * Save model templates configuration
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    logger.info("[API] Saving model templates configuration");

    // Validate request body with Zod
    const validation = validateRequestBody(
      modelTemplateSaveRequestSchema,
      body
    );

    if (!validation.success) {
      logger.error(
        "[API] Model templates request validation failed:",
        validation.errors
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: validation.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { model_templates } = validation.data || {};

    // Read existing config to preserve default_model
    const existingContent = await fs.readFile(MODEL_TEMPLATES_PATH, "utf-8");
    const existingConfig = JSON.parse(existingContent);

    // Merge with existing configuration
    const updatedConfig = {
      ...existingConfig,
      model_templates: model_templates || {},
    };

    // Validate updated configuration
    const configValidation = validateConfig(
      modelTemplatesConfigSchema,
      updatedConfig,
      "model-templates"
    );

    if (!configValidation.success) {
      logger.error(
        "[API] Updated model templates validation failed:",
        configValidation.errors
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid model templates configuration",
          details: configValidation.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Write to file
    await fs.writeFile(
      MODEL_TEMPLATES_PATH,
      JSON.stringify(updatedConfig, null, 2),
      "utf-8"
    );

    logger.info(
      "[API] Model templates saved successfully:",
      Object.keys(model_templates || {}).length
    );

    return NextResponse.json({
      success: true,
      data: {
        model_templates: model_templates || {},
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[API] Error saving model templates:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save model templates",
        details: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
