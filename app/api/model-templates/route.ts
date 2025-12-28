import { NextResponse, NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getLogger } from "@/lib/logger";
import { validateRequestBody, validateConfig } from "@/lib/validation-utils";
import { modelTemplatesConfigSchema, modelTemplateSaveRequestSchema } from "@/lib/validators";
import { getModelTemplatesConfig, updateModelTemplatesConfig, invalidateModelTemplatesCache } from "@/lib/model-templates-config";

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
    // ✅ Use cached config from memory (instant!)
    const config = getModelTemplatesConfig();

    if (!config) {
      // Cache miss - load from disk once
      logger.info("[API] Config cache miss, loading from disk");
      const fileContent = await fs.readFile(MODEL_TEMPLATES_PATH, "utf-8");
      const templatesData = JSON.parse(fileContent);

      // Validate loaded data before returning
      const validation = validateConfig(
        modelTemplatesConfigSchema,
        templatesData,
        "model-templates"
      );

      if (!validation.success) {
        logger.error(
          "[API] Invalid config loaded from disk:",
          validation.errors
        );
        
        // Return default empty templates if validation fails
        return NextResponse.json({
          success: true,
          data: {
            model_templates: {},
            default_model: null,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Store in cache
      const loadedConfig = {
        model_templates: templatesData.model_templates || {},
        default_model: templatesData.default_model || null,
      };

      return NextResponse.json({
        success: true,
        data: loadedConfig,
        timestamp: new Date().toISOString(),
      });
    }

    // ✅ Cache hit - return instantly (0ms disk I/O!)
    logger.info("[API] Config cache hit, returning cached config");

    // Return cached config - already validated when loaded
    return NextResponse.json({
      success: true,
      data: {
        model_templates: config.model_templates || {},
        default_model: config.default_model || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[API] Error loading model templates:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to load model templates",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
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

    // Access validation.data - validation.success is guaranteed true here
    const { model_templates } = validation.data!;

      // Update cache in memory AND persist to disk
      updateModelTemplatesConfig({ model_templates: model_templates || {} });

      // Invalidate cache to force reload on next GET
      invalidateModelTemplatesCache();

      logger.info(
        "[API] Model templates saved successfully:",
        Object.keys(model_templates || {}).length
      );

      return NextResponse.json({
        success: true,
        data: {
          model_templates: getModelTemplatesConfig()?.model_templates || {},
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
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
