import { exec } from "child_process";
import { promisify } from "util";
import type { SystemMetrics } from "@/types/monitoring";
import type { ModelDisplayData } from "./server.types";
import { LLAMA_SERVER_HOST, LLAMA_SERVER_PORT, MODEL_STATUS_MAP } from "./server.constants";

const execAsync = promisify(exec);

export async function getCpuMemoryUsage(): Promise<{ cpu: number; memory: number }> {
  try {
    const { stdout: cpuOut } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
    const cpu = parseFloat(cpuOut.trim()) || 0;

    const { stdout: memOut } = await execAsync("free | grep Mem | awk '{print ($3/$2) * 100.0}'");
    const memory = parseFloat(memOut.trim()) || 0;

    return { cpu: Math.round(cpu), memory: Math.round(memory) };
  } catch {
    return { cpu: 0, memory: 0 };
  }
}

export async function getDiskUsage(): Promise<number> {
  try {
    const { stdout } = await execAsync("df / | tail -1 | awk '{print $5}' | cut -d'%' -f1");
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

export async function getGpuMetrics(): Promise<SystemMetrics["gpu"]> {
  try {
    const { stdout } = await execAsync(
      "nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total,power.draw,power.limit,temperature.gpu,name --format=csv,noheader,nounits"
    );

    if (!stdout.trim()) {
      return undefined;
    }

    const [gpuIndex, gpu, memUsed, memTotal, powerUsed, powerLimit, temp, name] = stdout
      .trim()
      .split(",")
      .map((s) => s.trim());

    if (gpuIndex !== "0") {
      return undefined;
    }

    return {
      usage: parseFloat(gpu) || 0,
      memoryUsed: parseFloat(memUsed) || 0,
      memoryTotal: parseFloat(memTotal) || 0,
      powerUsage: parseFloat(powerUsed) || 0,
      powerLimit: parseFloat(powerLimit) || 0,
      temperature: parseFloat(temp) || 0,
      name: name || "Unknown GPU",
    };
  } catch {
    return undefined;
  }
}

export function normalizeModelStatus(status: unknown): string {
  if (typeof status === "string") {
    return MODEL_STATUS_MAP[status as keyof typeof MODEL_STATUS_MAP] || status;
  }
  if (status && typeof status === "object" && "value" in status) {
    return MODEL_STATUS_MAP[(status as { value: string }).value as keyof typeof MODEL_STATUS_MAP] || (status as { value: string }).value;
  }
  return "idle";
}

interface LlamaModelRaw {
  id?: string;
  name: string;
  type?: string;
  status: unknown;
  size?: number;
  template?: string;
  availableTemplates?: string[];
  modified_at: number;
}

export function transformLlamaModelToDisplay(model: unknown): ModelDisplayData {
  const modelData = model as LlamaModelRaw;
  const result: ModelDisplayData = {
    id: modelData.id || modelData.name,
    name: modelData.name,
    type: modelData.type || "unknown",
    status: normalizeModelStatus(modelData.status),
    createdAt: new Date(modelData.modified_at * 1000).toISOString(),
    updatedAt: new Date(modelData.modified_at * 1000).toISOString(),
  };

  if (modelData.size !== undefined) {
    result.size = modelData.size;
  }
  if (modelData.template !== undefined) {
    result.template = modelData.template;
  }
  if (modelData.availableTemplates !== undefined) {
    result.availableTemplates = modelData.availableTemplates;
  }

  return result;
}

export async function startModelViaChatCompletion(modelName: string): Promise<boolean> {
  try {
    const response = await fetch(`http://${LLAMA_SERVER_HOST}:${LLAMA_SERVER_PORT}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
