import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";

jest.mock("@mui/material/styles", () => ({
  ThemeProvider: ({ children, theme }: any) => (
    <div data-testid="mui-theme-provider" data-theme-mode={theme?.palette?.mode}>{children}</div>
  ),
}));

jest.mock("@mui/material", () => ({
  CssBaseline: () => <div data-testid="css-baseline"></div>,
}));

test("debug mock rendering", () => {
  const { container } = render(
    <ThemeProvider>
      <div>Test</div>
    </ThemeProvider>
  );

  console.log("Container HTML:", container.innerHTML);
  expect(screen.getByText("Test")).toBeInTheDocument();
});
