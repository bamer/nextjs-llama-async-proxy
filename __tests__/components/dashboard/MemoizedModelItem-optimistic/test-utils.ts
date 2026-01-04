/**
 * Shared test utilities for MemoizedModelItem-optimistic tests
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoizedModelItem } from "@/components/dashboard/MemoizedModelItem";

export const defaultProps = {
  model: {
    id: "model-1",
    name: "llama-2-7b",
    status: "idle" as const,
    type: "llama" as const,
  },
  isDark: false,
  currentTemplate: "",
  loadingModels: {},
  setLoadingModels: jest.fn(),
  selectedTemplates: {},
  onSaveTemplate: jest.fn(),
  onSaveTemplateToConfig: jest.fn(),
  onToggleModel: jest.fn(),
  onToggleModelOptimistic: jest.fn(),
};

export function renderModelItem(props = defaultProps) {
  return render(<MemoizedModelItem {...props} />);
}

export function findStartButton() {
  return screen.getByRole("button", { name: /start/i });
}

export function findStopButton() {
  return screen.getByRole("button", { name: /stop/i });
}

export function mockSuccessfulFetch() {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ success: true }),
    })
  ) as jest.Mock;
}

export function mockFailedFetch(errorMessage: string) {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error(errorMessage))
  ) as jest.Mock;
}
