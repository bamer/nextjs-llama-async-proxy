/**
 * Shared test utilities for ModelConfigDialog integration tests
 */

import { useStore } from "@/lib/store";

export const mockStoreModel = {
  id: "1",
  name: "llama-2-7b",
  type: "llama" as const,
  status: "idle" as const,
  parameters: {
    ctx_size: 2048,
    batch_size: 512,
    threads: 4,
  },
  createdAt: new Date("2024-01-01").toISOString(),
  updatedAt: new Date("2024-01-01").toISOString(),
};

export function setupStoreModel() {
  useStore.getState().setModels([mockStoreModel]);
}
