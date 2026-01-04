import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoizedModelItem } from "@/components/dashboard/MemoizedModelItem";
import {
  defaultProps,
  renderModelItem,
  findStartButton,
  mockSuccessfulFetch,
} from "./test-utils";

describe("MemoizedModelItem-optimistic - Loading Models State Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuccessfulFetch();
  });

  it("should set loading to true on action start", () => {
    const setLoadingModels = jest.fn();

    renderModelItem({
      ...defaultProps,
      setLoadingModels,
    });

    const startButton = findStartButton();
    fireEvent.click(startButton);

    expect(setLoadingModels).toHaveBeenCalledWith(
      expect.objectContaining({
        "model-1": true,
      })
    );
  });

  it("should set loading to false on completion", async () => {
    const setLoadingModels = jest.fn();

    renderModelItem({
      ...defaultProps,
      setLoadingModels,
    });

    const startButton = findStartButton();
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(setLoadingModels).toHaveBeenCalledWith(
        expect.objectContaining({
          "model-1": false,
        })
      );
    });
  });
});

describe("MemoizedModelItem-optimistic - Optimistic UI Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuccessfulFetch();
  });

  it("should handle missing onToggleModelOptimistic gracefully", () => {
    const { onToggleModelOptimistic: _, ...propsWithoutOptimistic } = defaultProps;
    renderModelItem(propsWithoutOptimistic);

    const startButton = findStartButton();
    fireEvent.click(startButton);

    expect(startButton).toBeInTheDocument();
  });

  it("should handle rapid successive clicks", () => {
    const onToggleModelOptimistic = jest.fn();

    renderModelItem({
      ...defaultProps,
      onToggleModelOptimistic,
    });

    const startButton = findStartButton();

    fireEvent.click(startButton);
    fireEvent.click(startButton);
    fireEvent.click(startButton);

    expect(onToggleModelOptimistic).toHaveBeenCalledTimes(1);
  });
});

describe("MemoizedModelItem-optimistic - Success Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuccessfulFetch();
  });

  it("should call onToggleModel on successful action", async () => {
    const onToggleModel = jest.fn();

    renderModelItem({
      ...defaultProps,
      onToggleModel,
    });

    const startButton = findStartButton();
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(onToggleModel).toHaveBeenCalledWith("model-1");
    });
  });

  it("should not revert status on success", async () => {
    const onToggleModelOptimistic = jest.fn();

    renderModelItem({
      ...defaultProps,
      onToggleModelOptimistic,
    });

    const startButton = findStartButton();
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(onToggleModelOptimistic).toHaveBeenCalledTimes(1);
      expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "loading");
    });
  });
});
