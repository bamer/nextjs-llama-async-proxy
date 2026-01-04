import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const theme = createTheme();
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export function renderWithProviders(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </QueryClientProvider>
  );
  return render(component, { wrapper });
}

export const mockSendMessage = jest.fn();

export async function waitForLoadingToFinish() {
  const { waitFor } = await import("@testing-library/react");
  await waitFor(() => {
    const { screen } = require("@testing-library/react");
    expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
  });
}
