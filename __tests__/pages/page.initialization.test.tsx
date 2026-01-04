import { renderHomePage, mockThemeLight, mockThemeDark } from "./test-utils";

describe("HomePage - Initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("mounts without errors", () => {
    const { container } = renderHomePage();
    expect(container.firstChild).toBeInTheDocument();
  });

  it("unmounts cleanly", () => {
    const { unmount } = renderHomePage();
    expect(() => unmount()).not.toThrow();
  });

  it("re-renders correctly", () => {
    const { rerender } = renderHomePage();
    rerender(renderHomePage());
  });

  it("uses theme context", () => {
    const { unmount } = renderHomePage();
    expect(mockThemeLight.setMode).toBeDefined();
    expect(mockThemeLight.toggleTheme).toBeDefined();
    unmount();
  });

  it("renders with MainLayout", () => {
    const { getByTestId } = renderHomePage();
    expect(getByTestId("main-layout")).toBeInTheDocument();
  });
});
