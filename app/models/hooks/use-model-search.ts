import { useMemo } from "react";
import type { ModelConfig } from "@/types";

export function useModelSearch(
  models: ModelConfig[],
  searchTerm: string,
): ModelConfig[] {
  return useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      return models;
    }

    const searchLower = searchTerm.toLowerCase().trim();

    return models.filter((model) => {
      const fieldsToSearch = [
        model.name,
        model.type,
        model.status,
        model.createdAt,
        model.updatedAt,
      ];

      return fieldsToSearch.some((field) =>
        String(field).toLowerCase().includes(searchLower),
      );
    });
  }, [models, searchTerm]);
}
