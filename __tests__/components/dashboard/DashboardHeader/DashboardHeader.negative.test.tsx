import { render, screen, fireEvent } from "@testing-library/react";
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

describe("DashboardHeader Negative Tests", () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles undefined metrics gracefully", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
    expect(screen.queryByText(/Uptime:/i)).not.toBeInTheDocument();
  });

  it("handles null metrics gracefully", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={null as any}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
  });

  it("handles empty metrics object", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={{}}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
  });

  it("handles undefined uptime in metrics", () => {
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

    expect(screen.getByText("Uptime: N/A")).toBeInTheDocument();
  });

  it("handles zero uptime", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 0,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("Uptime: N/A")).toBeInTheDocument();
  });

  it("handles negative uptime gracefully", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: -3600,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText(/-\d+d -\d+h \d+m/)).toBeInTheDocument();
  });

  it("handles NaN uptime gracefully", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: NaN,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("Uptime: N/A")).toBeInTheDocument();
  });

  it("handles missing onRefresh callback without throwing", () => {
    expect(() => {
      renderWithProviders(
        <DashboardHeader isConnected={true} metrics={undefined} onRefresh={undefined as any} />
      );
    }).not.toThrow();
  });
});
