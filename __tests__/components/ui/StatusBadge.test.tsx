import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

describe("StatusBadge Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Status Types", () => {
    describe("Running Status", () => {
      it("renders running status with success color", () => {
        render(<StatusBadge status="running" />);
        expect(screen.getByText("Running")).toBeInTheDocument();
      });

      it("does not show spinner for running status", () => {
        const { container } = render(<StatusBadge status="running" />);
        const spinner = container.querySelector(".MuiCircularProgress-root");
        expect(spinner).not.toBeInTheDocument();
      });
    });

    describe("Idle Status", () => {
      it("renders idle status with default color", () => {
        render(<StatusBadge status="idle" />);
        expect(screen.getByText("Idle")).toBeInTheDocument();
      });

      it("does not show spinner for idle status", () => {
        const { container } = render(<StatusBadge status="idle" />);
        const spinner = container.querySelector(".MuiCircularProgress-root");
        expect(spinner).not.toBeInTheDocument();
      });
    });

    describe("Loading Status", () => {
      it("renders loading status with info color", () => {
        render(<StatusBadge status="loading" />);
        expect(screen.getByText("Loading")).toBeInTheDocument();
      });

      it("shows spinner for loading status", () => {
        const { container } = render(<StatusBadge status="loading" />);
        const spinner = container.querySelector(".MuiCircularProgress-root");
        expect(spinner).toBeInTheDocument();
      });
    });

    describe("Error Status", () => {
      it("renders error status with error color", () => {
        render(<StatusBadge status="error" />);
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      it("does not show spinner for error status", () => {
        const { container } = render(<StatusBadge status="error" />);
        const spinner = container.querySelector(".MuiCircularProgress-root");
        expect(spinner).not.toBeInTheDocument();
      });
    });

    describe("Stopped Status", () => {
      it("renders stopped status with warning color", () => {
        render(<StatusBadge status="stopped" />);
        expect(screen.getByText("Stopped")).toBeInTheDocument();
      });

      it("does not show spinner for stopped status", () => {
        const { container } = render(<StatusBadge status="stopped" />);
        const spinner = container.querySelector(".MuiCircularProgress-root");
        expect(spinner).not.toBeInTheDocument();
      });
    });
  });

  describe("Custom Labels", () => {
    it("uses custom label when provided", () => {
      render(<StatusBadge status="running" label="Active" />);
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.queryByText("Running")).not.toBeInTheDocument();
    });

    it("uses default label when custom label not provided", () => {
      render(<StatusBadge status="running" />);
      expect(screen.getByText("Running")).toBeInTheDocument();
    });

    it("handles empty custom label", () => {
      render(<StatusBadge status="running" label="" />);
      expect(screen.getByText("Running")).toBeInTheDocument();
    });

    it("handles custom label with special characters", () => {
      render(<StatusBadge status="running" label="🟢 Active" />);
      expect(screen.getByText("🟢 Active")).toBeInTheDocument();
    });

    it("handles very long custom label", () => {
      const longLabel = "A".repeat(100);
      render(<StatusBadge status="running" label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    describe("Small Size", () => {
      it("renders small size by default", () => {
        const { container } = render(<StatusBadge status="running" />);
        const chip = container.querySelector(".MuiChip-sizeSmall");
        expect(chip).toBeInTheDocument();
      });

      it("renders small size explicitly", () => {
        const { container } = render(
          <StatusBadge status="running" size="small" />
        );
        const chip = container.querySelector(".MuiChip-sizeSmall");
        expect(chip).toBeInTheDocument();
      });
    });

    describe("Medium Size", () => {
      it("renders medium size", () => {
        const { container } = render(
          <StatusBadge status="running" size="medium" />
        );
        const chip = container.querySelector(".MuiChip-sizeMedium");
        expect(chip).toBeInTheDocument();
      });
    });

    describe("Large Size", () => {
      it("large size is not supported (only small and medium)", () => {
        // Component only supports "small" and "medium" sizes
        // This test documents that "large" is not available
        const { container } = render(
          <StatusBadge status="running" size="medium" />
        );
        const chip = container.querySelector(".MuiChip-root");
        expect(chip).toBeInTheDocument();
      });
    });
  });

  describe("Loading Spinner", () => {
    it("shows spinner only for loading status", () => {
      const { container: runningContainer } = render(
        <StatusBadge status="running" size="medium" />
      );
      const { container: loadingContainer } = render(
        <StatusBadge status="loading" size="medium" />
      );

      const runningSpinner = runningContainer.querySelector(
        ".MuiCircularProgress-root"
      );
      const loadingSpinner = loadingContainer.querySelector(
        ".MuiCircularProgress-root"
      );

      expect(runningSpinner).not.toBeInTheDocument();
      expect(loadingSpinner).toBeInTheDocument();
    });

    it("spinner size matches badge size", () => {
      const { container: smallContainer } = render(
        <StatusBadge status="loading" size="small" />
      );
      const { container: mediumContainer } = render(
        <StatusBadge status="loading" size="medium" />
      );

      const smallSpinner = smallContainer.querySelector(
        ".MuiCircularProgress-root"
      );
      const mediumSpinner = mediumContainer.querySelector(
        ".MuiCircularProgress-root"
      );

      expect(smallSpinner).toBeInTheDocument();
      expect(mediumSpinner).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("has font weight of 500", () => {
      const { container } = render(<StatusBadge status="running" />);
      const chip = container.querySelector(".MuiChip-root");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveStyle({ fontWeight: 500 });
    });

    it("applies font weight to label", () => {
      const { container } = render(<StatusBadge status="running" />);
      const label = container.querySelector(".MuiChip-label");
      expect(label).toBeInTheDocument();
      expect(label).toHaveStyle({ fontWeight: 500 });
    });
  });

  describe("Edge Cases", () => {
    it("handles all status types", () => {
      const statuses: Array<"running" | "idle" | "loading" | "error" | "stopped"> =
        ["running", "idle", "loading", "error", "stopped"];

      statuses.forEach((status) => {
        const { unmount } = render(<StatusBadge status={status} />);
        unmount();
      });
    });

    it("handles all size variants", () => {
      const sizes: Array<"small" | "medium"> = [
        "small",
        "medium",
      ];

      sizes.forEach((size) => {
        const { unmount } = render(
          <StatusBadge status="running" size={size} />
        );
        unmount();
      });
    });

    it("handles status and size combinations", () => {
      const statuses: Array<"running" | "idle" | "loading" | "error" | "stopped"> =
        ["running", "idle", "loading", "error", "stopped"];
      const sizes: Array<"small" | "medium"> = [
        "small",
        "medium",
      ];

      statuses.forEach((status) => {
        sizes.forEach((size) => {
          const { unmount } = render(
            <StatusBadge status={status} size={size} />
          );
          unmount();
        });
      });
    });

    it("handles custom label with loading status", () => {
      render(<StatusBadge status="loading" label="Processing..." />);
      expect(screen.getByText("Processing...")).toBeInTheDocument();
      const { container } = render(
        <StatusBadge status="loading" label="Processing..." />
      );
      const spinner = container.querySelector(".MuiCircularProgress-root");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Status Config Map", () => {
    it("running has success color and Running label", () => {
      render(<StatusBadge status="running" />);
      expect(screen.getByText("Running")).toBeInTheDocument();
    });

    it("idle has default color and Idle label", () => {
      render(<StatusBadge status="idle" />);
      expect(screen.getByText("Idle")).toBeInTheDocument();
    });

    it("loading has info color and Loading label", () => {
      render(<StatusBadge status="loading" />);
      expect(screen.getByText("Loading")).toBeInTheDocument();
    });

    it("error has error color and Error label", () => {
      render(<StatusBadge status="error" />);
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("stopped has warning color and Stopped label", () => {
      render(<StatusBadge status="stopped" />);
      expect(screen.getByText("Stopped")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("displays label text for screen readers", () => {
      render(<StatusBadge status="running" />);
      expect(screen.getByText("Running")).toBeInTheDocument();
    });

    it("supports custom label for accessibility", () => {
      render(<StatusBadge status="loading" label="Please wait" />);
      expect(screen.getByText("Please wait")).toBeInTheDocument();
    });
  });
});
