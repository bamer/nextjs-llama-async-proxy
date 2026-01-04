import { screen, fireEvent, render } from "@testing-library/react";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { createMockHandlers, renderDashboardActions } from "./DashboardActions.test-utils";

describe("DashboardActions - Button Interactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Restart Server Button", () => {
    it("renders Restart Server button", () => {
      renderDashboardActions(false, false);
      expect(screen.getByText("Restart Server")).toBeInTheDocument();
    });

    it("calls onRestart when clicked", () => {
      const mockHandlers = createMockHandlers();
      const { unmount } = render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Restart Server"));
      expect(mockHandlers.onRestart).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("does not call onRestart when disabled and clicked", () => {
      const mockHandlers = createMockHandlers();
      const { unmount } = render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Restarting..."));
      expect(mockHandlers.onRestart).not.toHaveBeenCalled();

      unmount();
    });

    it("shows 'Restarting...' when loading", () => {
      renderDashboardActions(false, true);
      expect(screen.getByText("Restarting...")).toBeInTheDocument();
    });
  });

  describe("Start Server Button", () => {
    it("renders Start Server button", () => {
      renderDashboardActions(false, false);
      expect(screen.getByText("Start Server")).toBeInTheDocument();
    });

    it("calls onStart when clicked", () => {
      const mockHandlers = createMockHandlers();
      const { unmount } = render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Start Server"));
      expect(mockHandlers.onStart).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("does not call onStart when server is running and clicked", () => {
      const mockHandlers = createMockHandlers();
      const { unmount } = render(
        <DashboardActions
          serverRunning={true}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Start Server"));
      expect(mockHandlers.onStart).not.toHaveBeenCalled();

      unmount();
    });

    it("does not call onStart when loading and clicked", () => {
      const mockHandlers = createMockHandlers();
      const { unmount } = render(
        <DashboardActions
          serverRunning={false}
          serverLoading={true}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Starting..."));
      expect(mockHandlers.onStart).not.toHaveBeenCalled();

      unmount();
    });

    it("shows 'Starting...' when loading", () => {
      renderDashboardActions(false, true);
      expect(screen.getByText("Starting...")).toBeInTheDocument();
    });
  });

  describe("Refresh Button", () => {
    it("renders Refresh button", () => {
      renderDashboardActions(false, false);
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });

    it("calls onRefresh when clicked", () => {
      const mockHandlers = createMockHandlers();
      const { unmount } = render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Refresh"));
      expect(mockHandlers.onRefresh).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("is not affected by server running state", () => {
      renderDashboardActions(true, false);
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });

    it("is not affected by loading state", () => {
      renderDashboardActions(false, true);
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
  });

  describe("Download Logs Button", () => {
    it("renders Download Logs button", () => {
      renderDashboardActions(false, false);
      expect(screen.getByText("Download Logs")).toBeInTheDocument();
    });

    it("calls onDownloadLogs when clicked", () => {
      const mockHandlers = createMockHandlers();
      const { unmount } = render(
        <DashboardActions
          serverRunning={false}
          serverLoading={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText("Download Logs"));
      expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("is not affected by server running state", () => {
      renderDashboardActions(true, false);
      expect(screen.getByText("Download Logs")).toBeInTheDocument();
    });

    it("is not affected by loading state", () => {
      renderDashboardActions(false, true);
      expect(screen.getByText("Download Logs")).toBeInTheDocument();
    });
  });

  describe("Multiple Button Interactions", () => {
    it("can click multiple buttons", () => {
      const mockHandlers = createMockHandlers();
      const { unmount } = render(
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

      unmount();
    });

    it("does not call handlers when buttons are disabled", () => {
      const mockHandlers = createMockHandlers();
      const { unmount } = render(
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

      unmount();
    });
  });
});
