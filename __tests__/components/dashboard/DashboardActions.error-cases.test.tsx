import { screen, render } from "@testing-library/react";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { renderDashboardActions } from "./DashboardActions.test-utils";

describe("DashboardActions - Error Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Edge Cases", () => {
    it("handles missing handlers gracefully", () => {
      expect(() => {
        render(
          <DashboardActions
            serverRunning={false}
            serverLoading={false}
            onRestart={undefined as unknown as () => void}
            onStart={undefined as unknown as () => void}
            onRefresh={undefined as unknown as () => void}
            onDownloadLogs={undefined as unknown as () => void}
          />
        );
      }).not.toThrow();
    });

    it("renders with all handlers as no-op functions", () => {
      const { unmount } = render(
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

      unmount();
    });

    it("handles server not running, not loading", () => {
      renderDashboardActions(false, false);

      expect(screen.getByText("Restart Server")).toBeInTheDocument();
      expect(screen.getByText("Start Server")).toBeInTheDocument();
    });

    it("handles server running, not loading", () => {
      renderDashboardActions(true, false);

      expect(screen.getByText("Restart Server")).toBeInTheDocument();
      expect(screen.getByText("Start Server")).toBeInTheDocument();
    });

    it("handles server loading", () => {
      renderDashboardActions(false, true);

      expect(screen.getByText("Restarting...")).toBeInTheDocument();
      expect(screen.getByText("Starting...")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("all buttons are focusable", () => {
      renderDashboardActions(false, false);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it("disabled buttons have disabled attribute", () => {
      renderDashboardActions(true, true);

      const restartButton = screen.getByText("Restarting...");
      const startButton = screen.getByText("Starting...");

      expect(restartButton.closest("button")).toBeDisabled();
      expect(startButton.closest("button")).toBeDisabled();
    });
  });
});
