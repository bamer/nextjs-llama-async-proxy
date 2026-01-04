import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoizedModelItem } from "@/components/dashboard/MemoizedModelItem";
import {
  defaultProps,
  renderModelItem,
  findStartButton,
  findStopButton,
  mockSuccessfulFetch,
} from "./test-utils";

describe("MemoizedModelItem-optimistic - Loading States", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuccessfulFetch();
  });

  it("should disable button when loading", () => {
    renderModelItem({
      ...defaultProps,
      loadingModels: { "model-1": true },
    });

    const startButton = findStartButton();
    expect(startButton).toBeDisabled();
  });

  it("should disable button when optimistically loading", () => {
    renderModelItem({
      ...defaultProps,
      optimisticStatus: "loading",
    });

    const startButton = findStartButton();
    expect(startButton).toBeDisabled();
  });
});
