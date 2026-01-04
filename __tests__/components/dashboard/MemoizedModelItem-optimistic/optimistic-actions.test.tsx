import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoizedModelItem } from "@/components/dashboard/MemoizedModelItem";
import {
  defaultProps,
  renderModelItem,
  findStartButton,
  findStopButton,
  mockSuccessfulFetch,
} from "./test-utils";

describe("MemoizedModelItem-optimistic - Optimistic Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuccessfulFetch();
  });

  it("should call start API with template", async () => {
    const onToggleModel = jest.fn();

    renderModelItem({
      ...defaultProps,
      selectedTemplates: { "llama-2-7b": "llama-2-7b" },
      onToggleModel,
    });

    const startButton = findStartButton();
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/models/llama-2-7b/start"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("llama-2-7b"),
        })
      );
    });
  });

  it("should call stop API", async () => {
    const onToggleModel = jest.fn();

    renderModelItem({
      ...defaultProps,
      model: {
        ...defaultProps.model,
        status: "running",
      },
      onToggleModel,
    });

    const stopButton = findStopButton();
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/models/llama-2-7b/stop"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  it("should update to stopped status optimistically", () => {
    const onToggleModelOptimistic = jest.fn();

    renderModelItem({
      ...defaultProps,
      model: {
        ...defaultProps.model,
        status: "running",
      },
      onToggleModelOptimistic,
    });

    const stopButton = findStopButton();
    fireEvent.click(stopButton);

    expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "stopped");
  });
});
