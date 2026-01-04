import React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

jest.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ isDark: false, mode: "light" as const, setMode: jest.fn(), toggleTheme: jest.fn(), currentTheme: null }),
}));

export const theme = createTheme();

export function renderWithProviders(component: React.ReactElement) {
  return render(
    <MuiThemeProvider theme={theme}>
      <ThemeProvider>{component}</ThemeProvider>
    </MuiThemeProvider>
  );
}
