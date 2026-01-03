import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import type { MockModelConfig } from "__tests__/types/mock-types";

// Mock MUI components
jest.mock("@mui/material", () => ({
  Card: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "card", className: "MuiCard-root" }, children),
  CardContent: ({ children, ...props }: any) => React.createElement("div", { ...props }, children),
  Typography: ({ children, ...props }: any) => React.createElement("span", props, children),
  Box: ({ children, ...props }: any) => React.createElement("div", props, children),
  Chip: ({ label, ...props }: any) => React.createElement("span", { ...props, "data-testid": "chip" }, label),
  Button: React.forwardRef(({ children, ...props }: any, ref) =>
    React.createElement("button", { ...props, ref }, children)
  ),
  Grid: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "grid" }, children),
  LinearProgress: ({ ...props }: any) => React.createElement("div", { ...props, "data-testid": "linear-progress" }),
  MenuItem: ({ children, ...props }: any) => React.createElement("option", props, children),
  Select: React.forwardRef(({ children, ...props }: any, ref) =>
    React.createElement("select", { ...props, ref }, children)
  ),
  InputLabel: ({ children, ...props }: any) => React.createElement("label", props, children),
  FormControl: ({ children, ...props }: any) => React.createElement("div", props, children),
  Tooltip: ({ children, ...props }: any) => React.createElement("div", props, children),
}));

jest.mock("@mui/icons-material", () => ({
  PlayArrow: () => null,
  Stop: () => null,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Common test data
export const mockModels = [
  {
    id: "model1",
    name: "Llama 2 7B",
    status: "running" as const,
    type: "llama" as const,
  },
  {
    id: "model2",
    name: "Mistral 7B",
    status: "idle" as const,
    type: "mistral" as const,
  },
];

// Common test utilities
export function renderWithProviders(component: React.ReactElement) {
  return render(component);
}

// Common beforeEach setup
export function setupBeforeEach() {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  });
}
