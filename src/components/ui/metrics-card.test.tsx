import { render, screen } from "@testing-library/react";
import { MetricsCard } from "@components/ui/metrics-card";
import { useStore } from "../../lib/store";
import { SystemMetrics } from "../../types/global";

// Mock the store
jest.mock("@lib/store");

describe("MetricsCard Component", () => {
  const mockMetrics: SystemMetrics = {
    cpuUsage: 45.2,
    memoryUsage: 67.8,
    diskUsage: 32.1,
    activeModels: 2,
    totalRequests: 150,
    avgResponseTime: 120,
    uptime: 3600,
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show loading state when metrics are null", () => {
    (useStore as jest.Mock).mockReturnValue({
      metrics: null,
    });

    render(<MetricsCard />);

    expect(screen.getByText("Loading metrics...")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should display metrics when available", () => {
    (useStore as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
    });

    render(<MetricsCard />);

    expect(screen.getByText("System Metrics")).toBeInTheDocument();
    expect(screen.getByText("Real-time system performance")).toBeInTheDocument();
    expect(screen.getByText("45.2%")).toBeInTheDocument();
    expect(screen.getByText("CPU Usage")).toBeInTheDocument();
    expect(screen.getByText("67.8%")).toBeInTheDocument();
    expect(screen.getByText("Memory Usage")).toBeInTheDocument();
  });

  it("should show all metric categories", () => {
    (useStore as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
    });

    render(<MetricsCard />);

    const metricLabels = [
      "CPU Usage",
      "Memory Usage",
      "Active Models",
      "Avg Response",
      "Total Requests",
    ];

    metricLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("should display progress bars with appropriate colors", () => {
    (useStore as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
    });

    render(<MetricsCard />);

    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(5);

    // Check that progress bars have the expected values
    expect(progressBars[0]).toHaveAttribute("aria-valuenow", "45.2"); // CPU
    expect(progressBars[1]).toHaveAttribute("aria-valuenow", "67.8"); // Memory
  });

  it("should have proper accessibility attributes", () => {
    (useStore as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
    });

    const { container } = render(<MetricsCard />);

    // Check that the card has proper role and structure
    const card = container.querySelector("div[role='article']");
    expect(card).toBeInTheDocument();
  });

  it("should be responsive", () => {
    (useStore as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
    });

    const { container } = render(<MetricsCard />);

    // Check that the grid layout is responsive
    const gridItems = container.querySelectorAll(".MuiGrid-item");
    expect(gridItems).toHaveLength(5);
  });
});