import { useCallback, useRef, useEffect, useState } from "react";

export interface MultiSelectState<T> {
  open: boolean;
  internalSelected: T[];
}

export function useMultiSelectState<T>(
  externalSelected: Set<T>
): MultiSelectState<T> & {
  setOpen: (open: boolean) => void;
  syncInternal: () => void;
} {
  const [open, setOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState<T[]>([]);
  const externalSelectedRef = useRef(externalSelected);

  // Sync internal state with external prop
  // Note: This syncs internal state with external prop changes, which is a valid use case
  const prevExternalSelectedRef = useRef(externalSelected);
  useEffect(() => {
    if (prevExternalSelectedRef.current !== externalSelected) {
      prevExternalSelectedRef.current = externalSelected;
      externalSelectedRef.current = externalSelected;
      const selectedArray = Array.from(externalSelected);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInternalSelected(selectedArray);
    }
  }, [externalSelected]);

  return {
    open,
    setOpen,
    internalSelected,
    syncInternal: () => {
      const selectedArray = Array.from(externalSelectedRef.current);
      setInternalSelected(selectedArray);
    },
  };
}

export interface MultiSelectionHandlers<T> {
  handleToggleAll: () => void;
  handleToggleItem: (value: T) => void;
  getIsSelectedAll: () => boolean;
  getIsSelectedSome: () => boolean;
}

export function useMultiSelectionHandlers<T>(
  options: Array<{ value: T }>,
  selected: Set<T>,
  onChange: (selected: Set<T>) => void,
  setOpen: (open: boolean) => void
): MultiSelectionHandlers<T> {
  const handleToggleAll = useCallback(() => {
    const newSelected =
      selected.size === options.length
        ? new Set<T>()
        : new Set(options.map((opt) => opt.value));
    onChange(newSelected);
    setOpen(false);
  }, [selected.size, options, onChange, setOpen]);

  const handleToggleItem = useCallback(
    (value: T) => {
      const currentSelected = new Set(selected);
      if (currentSelected.has(value)) {
        currentSelected.delete(value);
      } else {
        currentSelected.add(value);
      }
      onChange(currentSelected);
    },
    [selected, onChange]
  );

  const getIsSelectedAll = useCallback(() => selected.size === options.length, [selected.size, options.length]);
  const getIsSelectedSome = useCallback(() => selected.size > 0 && selected.size < options.length, [selected.size, options.length]);

  return {
    handleToggleAll,
    handleToggleItem,
    getIsSelectedAll,
    getIsSelectedSome,
  };
}
