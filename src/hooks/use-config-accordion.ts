"use client";

import { useState, useCallback } from "react";

interface UseConfigAccordionOptions {
  /**
   * Default expanded state for sections (section title -> isExpanded)
   */
  defaultExpanded?: Record<string, boolean>;
  /**
   * Whether all sections should be expanded by default
   */
  expandAllByDefault?: boolean;
}

interface UseConfigAccordionReturn {
  /**
   * Current expansion state of all sections
   */
  expandedSections: Record<string, boolean>;
  /**
   * Toggle a specific section's expansion state
   */
  toggleSection: (sectionTitle: string) => void;
  /**
   * Set a specific section's expansion state
   */
  setSectionExpanded: (sectionTitle: string, isExpanded: boolean) => void;
  /**
   * Expand all sections
   */
  expandAll: () => void;
  /**
   * Collapse all sections
   */
  collapseAll: () => void;
  /**
   * Check if a specific section is expanded
   */
  isSectionExpanded: (sectionTitle: string) => boolean;
}

/**
 * Custom hook for managing accordion expansion state across multiple config sections.
 * Provides functions to toggle individual sections or control all sections at once.
 *
 * @example
 * ```tsx
 * const { expandedSections, toggleSection, isSectionExpanded } = useConfigAccordion({
 *   expandAllByDefault: true,
 * });
 *
 * // In component
 * <Accordion expanded={isSectionExpanded('General')}>
 *   <AccordionSummary onClick={() => toggleSection('General')}>
 *     General Settings
 *   </AccordionSummary>
 * </Accordion>
 * ```
 */
export const useConfigAccordion = (
  options: UseConfigAccordionOptions = {}
): UseConfigAccordionReturn => {
  const { defaultExpanded = {}, expandAllByDefault = false } = options;

  const [expandedSections, setExpandedSections] =
    useState<Record<string, boolean>>(defaultExpanded);

  const toggleSection = useCallback((sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  }, []);

  const setSectionExpanded = useCallback((sectionTitle: string, isExpanded: boolean) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: isExpanded,
    }));
  }, []);

  const expandAll = useCallback(() => {
    setExpandedSections((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key] = true;
      });
      return newState;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSections((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key] = false;
      });
      return newState;
    });
  }, []);

  const isSectionExpanded = useCallback(
    (sectionTitle: string): boolean => {
      // If section is not in state, use expandAllByDefault option
      if (expandedSections[sectionTitle] === undefined) {
        return expandAllByDefault;
      }
      return expandedSections[sectionTitle];
    },
    [expandedSections, expandAllByDefault]
  );

  return {
    expandedSections,
    toggleSection,
    setSectionExpanded,
    expandAll,
    collapseAll,
    isSectionExpanded,
  };
};
