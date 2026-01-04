import { render } from "@testing-library/react";
import React from "react";
import type { MockModelConfig } from "__tests__/types/mock-types";

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...props }, ref) =>
    React.createElement("button", { ...props, ref }, children)
);
Button.displayName = "Button";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ children, ...props }, ref) =>
    React.createElement("select", { ...props, ref }, children)
);
Select.displayName = "Select";

jest.mock("@mui/material", () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement("div", { ...props, "data-testid": "card", className: "MuiCard-root" }, children),
  CardContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement("div", { ...props }, children),
  Typography: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
    React.createElement("span", props, children),
  Box: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement("div", props, children),
  Chip: ({ label, ...props }: React.HTMLAttributes<HTMLDivElement> & { label?: string }) =>
    React.createElement("span", { ...props, "data-testid": "chip" }, label),
  Button,
  Grid: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement("div", { ...props, "data-testid": "grid" }, children),
  LinearProgress: ({ ...props }: React.HTMLAttributes<HTMLDivElement> & { value?: number }) =>
    React.createElement("div", { ...props, "data-testid": "linear-progress" }),
  MenuItem: ({ children, ...props }: React.HTMLAttributes<HTMLOptionElement>) =>
    React.createElement("option", props, children),
  Select,
  InputLabel: ({ children, ...props }: React.HTMLAttributes<HTMLLabelElement>) =>
    React.createElement("label", props, children),
  FormControl: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement("div", props, children),
  Tooltip: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement("div", props, children),
}));

jest.mock("@mui/icons-material", () => ({
  PlayArrow: () => null,
  Stop: () => null,
}));

global.fetch = jest.fn();

export const mockModels: MockModelConfig[] = [
  { id: "model1", name: "Llama 2 7B", status: "running", type: "llama" },
  { id: "model2", name: "Mistral 7B", status: "idle", type: "mistral" },
];

export function renderWithProviders(component: React.ReactElement) {
  return render(component);
}

export function setupTestMocks() {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  });
}

export const allStatusModels: MockModelConfig[] = [
  { id: "model1", name: "Running Model", status: "running", type: "llama" },
  { id: "model2", name: "Idle Model", status: "idle", type: "mistral" },
  { id: "model3", name: "Loading Model", status: "loading", type: "other", progress: 50 },
  { id: "model4", name: "Error Model", status: "error", type: "llama" },
];

export const loadingModels: MockModelConfig[] = [
  {
    id: "model1",
    name: "Loading Model",
    status: "loading",
    type: "llama",
    progress: 45,
  },
];

export const errorModels: MockModelConfig[] = [
  {
    id: "model1",
    name: "Error Model",
    status: "error",
    type: "llama",
  },
];
