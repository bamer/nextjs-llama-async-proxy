import { render, screen } from "@testing-library/react";
import { WebSocketStatus } from "@components/ui/websocket-status";
import { useWebSocket } from "@hooks/use-websocket";

// Mock the hook
jest.mock("@hooks/use-websocket");

describe("WebSocketStatus Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show connected status", () => {
    (useWebSocket as jest.Mock).mockReturnValue({
      isConnected: true,
      connectionState: "connected",
    });

    render(<WebSocketStatus />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByTestId("WifiIcon")).toBeInTheDocument();
  });

  it("should show connecting status", () => {
    (useWebSocket as jest.Mock).mockReturnValue({
      isConnected: false,
      connectionState: "connecting",
    });

    render(<WebSocketStatus />);

    expect(screen.getByText("Connecting")).toBeInTheDocument();
    expect(screen.getByTestId("CloudSyncIcon")).toBeInTheDocument();
  });

  it("should show disconnected status", () => {
    (useWebSocket as jest.Mock).mockReturnValue({
      isConnected: false,
      connectionState: "disconnected",
    });

    render(<WebSocketStatus />);

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    expect(screen.getByTestId("WifiOffIcon")).toBeInTheDocument();
  });

  it("should show unknown status for unexpected states", () => {
    (useWebSocket as jest.Mock).mockReturnValue({
      isConnected: false,
      connectionState: "unknown",
    });

    render(<WebSocketStatus />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByTestId("ErrorOutlineIcon")).toBeInTheDocument();
  });

  it("should have proper tooltip for each status", () => {
    const statuses = [
      { state: "connected", tooltip: "WebSocket connected" },
      { state: "connecting", tooltip: "WebSocket connecting..." },
      { state: "disconnected", tooltip: "WebSocket disconnected" },
      { state: "unknown", tooltip: "WebSocket status unknown" },
    ];

    statuses.forEach(({ state, tooltip }) => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: state === "connected",
        connectionState: state,
      });

      render(<WebSocketStatus />);
      expect(screen.getByText(tooltip)).toBeInTheDocument();
    });
  });

  it("should have proper color for each status", () => {
    const statusColors = [
      { state: "connected", color: "success" },
      { state: "connecting", color: "warning" },
      { state: "disconnected", color: "error" },
      { state: "unknown", color: "default" },
    ];

    statusColors.forEach(({ state, color }) => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: state === "connected",
        connectionState: state,
      });

      const { container } = render(<WebSocketStatus />);
      const chip = container.querySelector(".MuiChip-root");
      expect(chip).toHaveClass(`MuiChip-color${color.charAt(0).toUpperCase() + color.slice(1)}`);
    });
  });

  it("should be accessible", () => {
    (useWebSocket as jest.Mock).mockReturnValue({
      isConnected: true,
      connectionState: "connected",
    });

    const { container } = render(<WebSocketStatus />);

    // Check that the component has proper ARIA attributes
    const chip = container.querySelector(".MuiChip-root");
    expect(chip).toHaveAttribute("role", "button");
  });
});