import { NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

export interface LoadSuccessResult {
  data: unknown;
  ok: true;
  status: number;
}

export interface LoadErrorResult {
  data: unknown;
  ok: false;
  status: number;
  error: string;
}

export type LoadResult = LoadSuccessResult | LoadErrorResult;

/**
 * Load model via llama-server
 * @param modelName - Model name to load
 * @param selectedTemplate - Optional template to use
 * @returns Load response data or null if failed
 */
export async function loadModelViaServer(
  modelName: string,
  selectedTemplate?: string
): Promise<LoadResult | null> {
  const llamaServerHost = process.env.LLAMA_SERVER_HOST || "localhost";
  const llamaServerPort = process.env.LLAMA_SERVER_PORT || "8134";

  logger.info(
    `[API] Forwarding model load to llama-server at ${llamaServerHost}:${llamaServerPort}`
  );

  const requestBody: Record<string, unknown> = {
    model: modelName,
    messages: [{ role: "user", content: "Hi" }],
    max_tokens: 1,
  };

  if (selectedTemplate) {
    requestBody.template = selectedTemplate;
  }

  const loadResponse = await fetch(
    `http://${llamaServerHost}:${llamaServerPort}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  ).catch((error) => {
    logger.error(
      `[API] Failed to connect to llama-server: ${error.message}`
    );
    return null;
  });

  if (!loadResponse) {
    return null;
  }

  const loadData = await loadResponse.json().catch(() => ({}));

  if (loadResponse.ok) {
    return {
      data: loadData,
      ok: true,
      status: loadResponse.status,
    };
  }

  return {
    data: loadData,
    ok: false,
    status: loadResponse.status,
    error: (loadData as { error?: string }).error || `Failed to load model (HTTP ${loadResponse.status})`,
  };
}

/**
 * Create success response for loaded model
 * @param name - Model name
 * @param loadData - Load response data
 * @returns NextResponse with success message
 */
export function createLoadSuccessResponse(name: string, loadData: unknown): NextResponse {
  logger.info(`[API] Model ${name} loaded successfully`);
  return NextResponse.json(
    {
      model: name,
      status: "loaded",
      message: `Model ${name} loaded successfully`,
      data: loadData,
    },
    { status: 200 }
  );
}

/**
 * Create error response for failed load
 * @param name - Model name
 * @param error - Error message
 * @param detail - Optional detail object
 * @returns NextResponse with error
 */
export function createLoadErrorResponse(name: string, error: string, detail?: unknown): NextResponse {
  const response: Record<string, unknown> = {
    error,
    model: name,
    status: "error",
  };

  if (detail !== undefined) {
    response.detail = detail;
  }

  return NextResponse.json(response, { status: 500 });
}
