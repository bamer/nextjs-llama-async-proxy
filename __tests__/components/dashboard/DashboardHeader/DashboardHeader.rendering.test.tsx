import { render, screen } from "@testing-library/react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { renderWithProviders } from "./DashboardHeader.test-utils";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("framer-motion", () => ({
  m: {
    div: ({ children, ...props }: unknown) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("DashboardHeader Rendering", () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with all props provided", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 3600,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Real-time AI Model Management & Monitoring")).toBeInTheDocument();
  });

  it("displays CONNECTED status when isConnected is true", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("CONNECTED")).toBeInTheDocument();
  });

  it("displays DISCONNECTED status when isConnected is false", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={false}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
  });

  it("displays uptime chip when metrics are provided", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 3600,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("Uptime: 0d 1h 0m")).toBeInTheDocument();
  });

  it("displays refresh button with correct tooltip", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("displays settings button with correct tooltip", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
  });

  it("formats uptime correctly for various values", () => {
    const testCases = [
      { uptime: 0, expected: "Uptime: N/A" },
      { uptime: 60, expected: "Uptime: 0d 0h 1m" },
      { uptime: 3600, expected: "Uptime: 0d 1h 0m" },
      { uptime: 86400, expected: "Uptime: 1d 0h 0m" },
    ];

    testCases.forEach(({ uptime, expected }) => {
      const { unmount } = renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{ uptime, cpuUsage: 50, memoryUsage: 60 }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it("handles transition from connected to disconnected state", () => {
    const { rerender } = renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("CONNECTED")).toBeInTheDocument();

    rerender(
      <DashboardHeader
        isConnected={false}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
  });
});
