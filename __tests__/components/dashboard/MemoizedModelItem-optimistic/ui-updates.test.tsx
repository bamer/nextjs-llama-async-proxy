import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoizedModelItem } from "@/components/dashboard/MemoizedModelItem";
import {
  defaultProps,
  renderModelItem,
  findStartButton,
  findStopButton,
  mockSuccessfulFetch,
  mockFailedFetch,
} from "./test-utils";

describe("MemoizedModelItem-optimistic - Optimistic UI Updates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuccessfulFetch();
  });

  it("should update UI immediately on start action", () => {
    const onToggleModelOptimistic = jest.fn();

    renderModelItem({
      ...defaultProps,
      onToggleModelOptimistic,
    });

    const startButton = findStartButton();
    fireEvent.click(startButton);

    expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "loading");
  });

  it("should update UI immediately on stop action", () => {
    const onToggleModelOptimistic = jest.fn();
    const runningModel = {
      ...defaultProps.model,
      status: "running" as const,
    };

    renderModelItem({
      ...defaultProps,
      model: runningModel,
      onToggleModelOptimistic,
    });

    const stopButton = findStopButton();
    fireEvent.click(stopButton);

    expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "stopped");
  });

  it("should display optimistic status immediately", () => {
    renderModelItem({
      ...defaultProps,
      optimisticStatus: "loading",
    });

    const statusChip = screen.getByText("LOADING");
    expect(statusChip).toBeInTheDocument();
  });

  it("should show optimistic loading state", () => {
    renderModelItem({
      ...defaultProps,
      optimisticStatus: "loading",
      model: {
        ...defaultProps.model,
        progress: 50,
      },
    });

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
  });
});
