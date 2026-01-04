import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoizedModelItem } from "@/components/dashboard/MemoizedModelItem";
import {
  defaultProps,
  renderModelItem,
  findStartButton,
  mockFailedFetch,
} from "./test-utils";

describe("MemoizedModelItem-optimistic - Error Reversion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFailedFetch("Failed to start model");
  });

  it("should revert to original status on error", async () => {
    const onToggleModelOptimistic = jest.fn();
    const onToggleModel = jest.fn();

    renderModelItem({
      ...defaultProps,
      onToggleModel,
      onToggleModelOptimistic,
    });

    const startButton = findStartButton();
    fireEvent.click(startButton);

    await waitFor(
      () => {
        expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "idle");
      },
      { timeout: 3000 }
    );
  });

  it("should show alert on error", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    renderModelItem({ ...defaultProps });

    const startButton = findStartButton();
    fireEvent.click(startButton);

    await waitFor(
      () => {
        expect(alertSpy).toHaveBeenCalledWith("Failed to start model");
      },
      { timeout: 3000 }
    );

    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
