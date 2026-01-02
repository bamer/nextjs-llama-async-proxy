import { renderHook, act } from "@testing-library/react";
import { useConfigAccordion } from "@/hooks/use-config-accordion";

describe("useConfigAccordion", () => {
  it("should initialize with empty state", () => {
    const { result } = renderHook(() => useConfigAccordion());

    expect(result.current.expandedSections).toEqual({});
  });

  it("should toggle section expansion", () => {
    const { result } = renderHook(() => useConfigAccordion());

    act(() => {
      result.current.toggleSection("General");
    });

    expect(result.current.expandedSections.General).toBe(true);

    act(() => {
      result.current.toggleSection("General");
    });

    expect(result.current.expandedSections.General).toBe(false);
  });

  it("should set section expansion state", () => {
    const { result } = renderHook(() => useConfigAccordion());

    act(() => {
      result.current.setSectionExpanded("General", true);
    });

    expect(result.current.isSectionExpanded("General")).toBe(true);
  });

  it("should check if section is expanded", () => {
    const { result } = renderHook(() => useConfigAccordion());

    expect(result.current.isSectionExpanded("Unknown")).toBe(false);

    const { result: result2 } = renderHook(() =>
      useConfigAccordion({ expandAllByDefault: true })
    );

    expect(result2.current.isSectionExpanded("Unknown")).toBe(true);
  });

  it("should expand all sections", () => {
    const { result } = renderHook(() =>
      useConfigAccordion({
        defaultExpanded: { General: false, Advanced: false },
      })
    );

    act(() => {
      result.current.expandAll();
    });

    expect(result.current.isSectionExpanded("General")).toBe(true);
    expect(result.current.isSectionExpanded("Advanced")).toBe(true);
  });

  it("should collapse all sections", () => {
    const { result } = renderHook(() =>
      useConfigAccordion({
        defaultExpanded: { General: true, Advanced: true },
      })
    );

    act(() => {
      result.current.collapseAll();
    });

    expect(result.current.isSectionExpanded("General")).toBe(false);
    expect(result.current.isSectionExpanded("Advanced")).toBe(false);
  });
});
