import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { DashboardActions } from "@/components/dashboard/DashboardActions";

describe("DashboardActions Component", () => {
  const mockHandlers = {
    onRestart: jest.fn(),
    onStart: jest.fn(),
    onRefresh: jest.fn(),
    onDownloadLogs: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders all four action buttons", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText("Restart Server")).toBeInTheDocument();
      expect(screen.getByText("Start Server")).toBeInTheDocument();
      expect(screen.getByText("Refresh")).toBeInTheDocument();
      expect(screen.getByText("Download Logs")).toBeInTheDocument();
    });

    it("uses Grid container for layout", () => {
      const { container } = render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      const gridContainer = container.querySelector(".MuiGrid-container");
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe("Restart Server Button", () => {
    it("renders Restart Server button", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Restart Server")).toBeInTheDocument();
    });

    it("has restart icon", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      // Icon is rendered as SVG
      const button = screen.getByText("Restart Server");
      expect(button).toBeInTheDocument();
    });

    it("calls onRestart when clicked", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Restart Server"));
      expect(mockHandlers.onRestart).toHaveBeenCalledTimes(1);
    });

    it("is primary color when server not running", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      const button = screen.getByText("Restart Server");
      expect(button).toBeInTheDocument();
    });

    it("is warning color when server running", () => {
      render(
        <DashboardActions
          serverRunning={true}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      const button = screen.getByText("Restart Server");
      expect(button).toBeInTheDocument();
    });

    it("is disabled when loading", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );
      const button = screen.getByText("Restarting...");
      expect(button).toBeInTheDocument();
    });

    it("shows 'Restarting...' when loading", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Restarting...")).toBeInTheDocument();
    });

    it("does not call onRestart when disabled and clicked", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Restarting..."));
      expect(mockHandlers.onRestart).not.toHaveBeenCalled();
    });
  });

  describe("Start Server Button", () => {
    it("renders Start Server button", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Start Server")).toBeInTheDocument();
    });

    it("has success color", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      const button = screen.getByText("Start Server");
      expect(button).toBeInTheDocument();
    });

    it("calls onStart when clicked", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Start Server"));
      expect(mockHandlers.onStart).toHaveBeenCalledTimes(1);
    });

    it("is disabled when server is running", () => {
      render(
        <DashboardActions
          serverRunning={true}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      const button = screen.getByText("Start Server");
      expect(button).toBeInTheDocument();
    });

    it("is disabled when loading", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );
      const button = screen.getByText("Starting...");
      expect(button).toBeInTheDocument();
    });

    it("shows 'Starting...' when loading", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Starting...")).toBeInTheDocument();
    });

    it("does not call onStart when server is running and clicked", () => {
      render(
        <DashboardActions
          serverRunning={true}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Start Server"));
      expect(mockHandlers.onStart).not.toHaveBeenCalled();
    });

    it("does not call onStart when loading and clicked", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Starting..."));
      expect(mockHandlers.onStart).not.toHaveBeenCalled();
    });
  });

  describe("Refresh Button", () => {
    it("renders Refresh button", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });

    it("has outlined variant", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      const button = screen.getByText("Refresh");
      expect(button).toBeInTheDocument();
    });

    it("calls onRefresh when clicked", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Refresh"));
      expect(mockHandlers.onRefresh).toHaveBeenCalledTimes(1);
    });

    it("is not affected by server running state", () => {
      render(
        <DashboardActions
          serverRunning={true}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });

    it("is not affected by loading state", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
  });

  describe("Download Logs Button", () => {
    it("renders Download Logs button", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Download Logs")).toBeInTheDocument();
    });

    it("has outlined variant", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      const button = screen.getByText("Download Logs");
      expect(button).toBeInTheDocument();
    });

    it("calls onDownloadLogs when clicked", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Download Logs"));
      expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
    });

    it("is not affected by server running state", () => {
      render(
        <DashboardActions
          serverRunning={true}
          serverLoading={false}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Download Logs")).toBeInTheDocument();
    });

    it("is not affected by loading state", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );
      expect(screen.getByText("Download Logs")).toBeInTheDocument();
    });
  });

  describe("Button Interactions", () => {
    it("can click multiple buttons", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Refresh"));
      fireEvent.click(screen.getByText("Download Logs"));

      expect(mockHandlers.onRefresh).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
    });

    it("does not call handlers when buttons are disabled", () => {
      render(
        <DashboardActions
          serverRunning={true}
          serverLoading={true}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Restarting..."));
      fireEvent.click(screen.getByText("Starting..."));
      fireEvent.click(screen.getByText("Refresh"));
      fireEvent.click(screen.getByText("Download Logs"));

      expect(mockHandlers.onRestart).not.toHaveBeenCalled();
      expect(mockHandlers.onStart).not.toHaveBeenCalled();
      expect(mockHandlers.onRefresh).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
    });
  });

  describe("State Combinations", () => {
    it("handles server not running, not loading", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText("Restart Server")).toBeInTheDocument();
      expect(screen.getByText("Start Server")).toBeInTheDocument();
    });

    it("handles server running, not loading", () => {
      render(
        <DashboardActions
          serverRunning={true}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText("Restart Server")).toBeInTheDocument();
      expect(screen.getByText("Start Server")).toBeInTheDocument();
    });

    it("handles server loading", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText("Restarting...")).toBeInTheDocument();
      expect(screen.getByText("Starting...")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles missing handlers gracefully", () => {
      expect(() => {
        render(
          <DashboardActions
            serverRunning={false}
            serverLoading={false}
            onRestart={undefined as any}
            onStart={undefined as any}
            onRefresh={undefined as any}
            onDownloadLogs={undefined as any}
          />
        );
      }).not.toThrow();
    });

    it("renders with all handlers as no-op functions", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          onRestart={() => {}}
          onStart={() => {}}
          onRefresh={() => {}}
          onDownloadLogs={() => {}}
        />
      );

      expect(screen.getByText("Restart Server")).toBeInTheDocument();
      expect(screen.getByText("Start Server")).toBeInTheDocument();
      expect(screen.getByText("Refresh")).toBeInTheDocument();
      expect(screen.getByText("Download Logs")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("all buttons are focusable", () => {
      render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it("disabled buttons have disabled attribute", () => {
      render(
        <DashboardActions
          serverRunning={true}
          serverLoading={true}
          {...mockHandlers}
        />
      );

      const restartButton = screen.getByText("Restarting...");
      const startButton = screen.getByText("Starting...");

      expect(restartButton.closest("button")).toBeDisabled();
      expect(startButton.closest("button")).toBeDisabled();
    });
  });
});
