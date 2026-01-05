"use client";

import { useState, useCallback } from "react";

export type ModelSelectionMode = "none" | "some" | "all";

interface UseBulkActionsOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  onBulkStart?: (ids: string[]) => Promise<void>;
  onBulkStop?: (ids: string[]) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
}

interface UseBulkActionsResult<T> {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  selectionMode: ModelSelectionMode;
  isProcessing: boolean;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelectAll: () => void;
  handleBulkStart: () => Promise<void>;
  handleBulkStop: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  getSelectedItems: (items: T[]) => T[];
}

export function useBulkActions<T>({
  items,
  getItemId,
  onBulkStart,
  onBulkStop,
  onBulkDelete,
}: UseBulkActionsOptions<T>): UseBulkActionsResult<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < items.length;
  const selectionMode: ModelSelectionMode = selectedIds.size === 0 ? "none" : isAllSelected ? "all" : "some";

  const selectItem = useCallback((id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      return new Set(prev).add(id);
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getItemId)));
  }, [items, getItemId]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  const handleBulkStart = useCallback(async () => {
    if (!onBulkStart || selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      await onBulkStart(Array.from(selectedIds));
      deselectAll();
    } finally {
      setIsProcessing(false);
    }
  }, [onBulkStart, selectedIds, deselectAll]);

  const handleBulkStop = useCallback(async () => {
    if (!onBulkStop || selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      await onBulkStop(Array.from(selectedIds));
      deselectAll();
    } finally {
      setIsProcessing(false);
    }
  }, [onBulkStop, selectedIds, deselectAll]);

  const handleBulkDelete = useCallback(async () => {
    if (!onBulkDelete || selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      deselectAll();
    } finally {
      setIsProcessing(false);
    }
  }, [onBulkDelete, selectedIds, deselectAll]);

  const getSelectedItems = useCallback(
    (allItems: T[]) => {
      return allItems.filter((item) => selectedIds.has(getItemId(item)));
    },
    [selectedIds, getItemId]
  );

  return {
    selectedIds,
    isAllSelected,
    isIndeterminate,
    selectionMode,
    isProcessing,
    selectItem,
    deselectItem,
    toggleSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    handleBulkStart,
    handleBulkStop,
    handleBulkDelete,
    getSelectedItems,
  };
}
