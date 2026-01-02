import { useMemo } from "react";
import type { ModelConfig } from "@/types";

interface FilterOptions {
  status?: string;
  type?: string;
  searchTerm?: string;
}

export function useModelFilter(
  models: ModelConfig[],
  filterOptions: FilterOptions,
): ModelConfig[] {
  return useMemo(() => {
    return models.filter((model) => {
      if (filterOptions.status && model.status !== filterOptions.status) {
        return false;
      }
      if (filterOptions.type && model.type !== filterOptions.type) {
        return false;
      }
      if (filterOptions.searchTerm) {
        const searchLower = filterOptions.searchTerm.toLowerCase();
        const nameMatch = model.name.toLowerCase().includes(searchLower);
        const typeMatch = model.type.toLowerCase().includes(searchLower);
        const statusMatch = model.status.toLowerCase().includes(searchLower);
        return nameMatch || typeMatch || statusMatch;
      }
      return true;
    });
  }, [models, filterOptions]);
}
