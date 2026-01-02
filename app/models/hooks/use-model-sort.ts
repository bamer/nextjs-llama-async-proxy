import { useMemo } from "react";
import type { ModelConfig } from "@/types";

type SortField = 'name' | 'type' | 'status' | 'updatedAt' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface SortOptions {
  field: SortField;
  order: SortOrder;
}

export function useModelSort(
  models: ModelConfig[],
  sortOptions: SortOptions,
): ModelConfig[] {
  return useMemo(() => {
    const sorted = [...models];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOptions.order === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [models, sortOptions]);
}
