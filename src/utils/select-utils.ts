import type { MultiSelectOption } from "@/components/ui/MultiSelect";

/**
 * Determines the display text for the MultiSelect based on selected items
 */
export function getDisplayValue<T = string>(
  selected: Set<T>,
  options: MultiSelectOption<T>[],
  placeholder: string,
  maxSelectedDisplay: number,
  displayAllWhenFull: boolean
): string {
  if (selected.size === 0) {
    return placeholder;
  }

  if (displayAllWhenFull || selected.size <= maxSelectedDisplay) {
    return options
      .filter((opt) => selected.has(opt.value))
      .map((opt) => opt.label)
      .join(", ");
  }

  return `${selected.size} selected`;
}

/**
 * Checks if all options are selected
 */
export function isSelectedAll<T = string>(
  selected: Set<T>,
  totalOptions: number
): boolean {
  return selected.size === totalOptions;
}

/**
 * Checks if some (but not all) options are selected
 */
export function isSelectedSome<T = string>(
  selected: Set<T>,
  totalOptions: number
): boolean {
  return selected.size > 0 && selected.size < totalOptions;
}

/**
 * Toggles all options (selects all or deselects all)
 */
export function toggleAllOptions<T = string>(
  options: MultiSelectOption<T>[]
): Set<T> {
  return new Set(options.map((opt) => opt.value));
}
