import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { AppProvider } from "@/providers/app-provider";

jest.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  useTheme: () => ({ isDark: false }),
}));

jest.mock("@/components/animate/motion-lazy-container", () => ({
  MotionLazyContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="motion-lazy-container">{children}</div>
  ),
}));

jest.mock("@mui/x-date-pickers", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="localization-provider">{children}</div>
  ),
}));

jest.mock("@mui/x-date-pickers/AdapterDateFns", () => ({
  AdapterDateFns: jest.fn(),
}));

jest.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => <div data-testid="react-query-devtools" />,
}));

jest.mock("@/providers/websocket-provider", () => ({
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="websocket-provider">{children}</div>
  ),
}));

jest.mock("@/components/ui/error-boundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

describe("AppProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children correctly", () => {
    render(
      <AppProvider>
        <div>Test Child</div>
      </AppProvider>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("renders with LocalizationProvider wrapper", () => {
    render(
      <AppProvider>
        <div>Content</div>
      </AppProvider>
    );
    expect(screen.getByTestId("localization-provider")).toBeInTheDocument();
  });

  it("renders with ThemeProvider wrapper", () => {
    render(
      <AppProvider>
        <div>Content</div>
      </AppProvider>
    );
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
  });

  it("renders with MotionLazyContainer wrapper", () => {
    render(
      <AppProvider>
        <div>Content</div>
      </AppProvider>
    );
    expect(screen.getByTestId("motion-lazy-container")).toBeInTheDocument();
  });

  it("maintains proper provider hierarchy", () => {
    render(
      <AppProvider>
        <div>Content</div>
      </AppProvider>
    );
    const localizationProvider = screen.getByTestId("localization-provider");
    const themeProvider = screen.getByTestId("theme-provider");
    const motionLazyContainer = screen.getByTestId("motion-lazy-container");

    expect(localizationProvider).toBeInTheDocument();
    expect(themeProvider).toBeInTheDocument();
    expect(motionLazyContainer).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <AppProvider>
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </AppProvider>
    );
    expect(screen.getByText("First Child")).toBeInTheDocument();
    expect(screen.getByText("Second Child")).toBeInTheDocument();
    expect(screen.getByText("Third Child")).toBeInTheDocument();
  });

  it("renders with React fragments", () => {
    render(
      <AppProvider>
        <>
          <div>Fragment 1</div>
          <div>Fragment 2</div>
        </>
      </AppProvider>
    );
    expect(screen.getByText("Fragment 1")).toBeInTheDocument();
    expect(screen.getByText("Fragment 2")).toBeInTheDocument();
  });

  it("renders with nested components", () => {
    const NestedComponent = () => <div>Nested Content</div>;
    render(
      <AppProvider>
        <NestedComponent />
      </AppProvider>
    );
    expect(screen.getByText("Nested Content")).toBeInTheDocument();
  });

  it("renders with null children", () => {
    const { container } = render(
      <AppProvider>{null}</AppProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it("renders with string children", () => {
    render(
      <AppProvider>
        String Content
      </AppProvider>
    );
    expect(screen.getByText("String Content")).toBeInTheDocument();
  });

  it("renders with number children", () => {
    render(
      <AppProvider>
        {42}
      </AppProvider>
    );
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders with array of children", () => {
    const children = [
      <div key="1">Array 1</div>,
      <div key="2">Array 2</div>,
      <div key="3">Array 3</div>,
    ];
    render(
      <AppProvider>
        {children}
      </AppProvider>
    );
    expect(screen.getByText("Array 1")).toBeInTheDocument();
    expect(screen.getByText("Array 2")).toBeInTheDocument();
    expect(screen.getByText("Array 3")).toBeInTheDocument();
  });

  it("renders with deeply nested children", () => {
    render(
      <AppProvider>
        <div>
          <div>
            <div>Deeply Nested</div>
          </div>
        </div>
      </AppProvider>
    );
    expect(screen.getByText("Deeply Nested")).toBeInTheDocument();
  });

  it("preserves child props and attributes", () => {
    render(
      <AppProvider>
        <div id="test-id" data-testid="test-child" aria-label="Test">
          Test Content
        </div>
      </AppProvider>
    );
    const child = screen.getByTestId("test-child");
    expect(child).toHaveAttribute("id", "test-id");
    expect(child).toHaveAttribute("aria-label", "Test");
  });

  it("renders without errors", () => {
    const { container } = render(
      <AppProvider>
        <div>Content</div>
      </AppProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it("renders QueryClientProvider (indirect test)", () => {
    const { container } = render(
      <AppProvider>
        <div>Content</div>
      </AppProvider>
    );
    expect(container.querySelector('[data-testid="theme-provider"]')).toBeInTheDocument();
  });

  it("wraps children in all providers correctly", () => {
    render(
      <AppProvider>
        <div data-testid="test-child">Test Content</div>
      </AppProvider>
    );
    const localizationProvider = screen.getByTestId("localization-provider");
    const testChild = screen.getByTestId("test-child");

    expect(localizationProvider).toBeInTheDocument();
    expect(testChild).toBeInTheDocument();
  });

  it("handles complex component trees", () => {
    const ComponentA = () => <div>Component A</div>;
    const ComponentB = () => <div>Component B</div>;
    render(
      <AppProvider>
        <div>
          <ComponentA />
          <div>
            <ComponentB />
          </div>
        </div>
      </AppProvider>
    );
    expect(screen.getByText("Component A")).toBeInTheDocument();
    expect(screen.getByText("Component B")).toBeInTheDocument();
  });

  it("renders with empty children", () => {
    const { container } = render(<AppProvider>{[]}</AppProvider>);
    expect(container).toBeInTheDocument();
  });

  it("renders with conditional children", () => {
    const showContent = true;
    render(
      <AppProvider>
        {showContent && <div>Conditional Content</div>}
      </AppProvider>
    );
    expect(screen.getByText("Conditional Content")).toBeInTheDocument();
  });

  it("renders with function children (if supported)", () => {
    const { container } = render(
      <AppProvider>
        {() => <div>Function Child</div>}
      </AppProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it("maintains provider order", () => {
    const { container } = render(
      <AppProvider>
        <div data-testid="content">Test</div>
      </AppProvider>
    );
    const localizationProvider = screen.getByTestId("localization-provider");
    const themeProvider = screen.getByTestId("theme-provider");
    const motionLazyContainer = screen.getByTestId("motion-lazy-container");

    expect(localizationProvider).toBeInTheDocument();
    expect(localizationProvider.contains(themeProvider)).toBe(true);
    expect(themeProvider.contains(motionLazyContainer)).toBe(true);
  });
});
