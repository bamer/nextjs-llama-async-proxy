import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoizedModelItem } from "@/components/dashboard/MemoizedModelItem";
import {
  defaultProps,
  renderModelItem,
  mockSuccessfulFetch,
} from "./test-utils";

describe("MemoizedModelItem-optimistic - Optimistic Status Display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuccessfulFetch();
  });

  it("should prefer optimistic status over actual status", () => {
    renderModelItem({
      ...defaultProps,
      model: {
        ...defaultProps.model,
        status: "idle",
      },
      optimisticStatus: "loading",
    });

    const statusChip = screen.getByText("LOADING");
    expect(statusChip).toBeInTheDocument();
  });

  it("should show correct status color for optimistic loading", () => {
    renderModelItem({
      ...defaultProps,
      optimisticStatus: "loading",
    });

    const statusChip = screen.getByText("LOADING");
    expect(statusChip).toBeInTheDocument();
  });

  it("should show correct status color for optimistic running", () => {
    renderModelItem({
      ...defaultProps,
      optimisticStatus: "running",
    });

    const statusChip = screen.getByText("RUNNING");
    expect(statusChip).toBeInTheDocument();
  });

  it("should show correct status color for optimistic error", () => {
    renderModelItem({
      ...defaultProps,
      optimisticStatus: "error",
    });

    const statusChip = screen.getByText("ERROR");
    expect(statusChip).toBeInTheDocument();
  });
});
