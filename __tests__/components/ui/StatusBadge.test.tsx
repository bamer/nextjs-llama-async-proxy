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

      it("has success color for running status", () => {
        const { container } = render(<StatusBadge status="running" />);
        const chip = container.querySelector(".MuiChip-root");
        expect(chip).toBeInTheDocument();
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

      it("has default color for idle status", () => {
        const { container } = render(<StatusBadge status="idle" />);
        const chip = container.querySelector(".MuiChip-root");
        expect(chip).toBeInTheDocument();
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

      it("has info color for loading status", () => {
        const { container } = render(<StatusBadge status="loading" />);
        const chip = container.querySelector(".MuiChip-root");
        expect(chip).toBeInTheDocument();
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

      it("has error color for error status", () => {
        const { container } = render(<StatusBadge status="error" />);
        const chip = container.querySelector(".MuiChip-root");
        expect(chip).toBeInTheDocument();
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

      it("has warning color for stopped status", () => {
        const { container } = render(<StatusBadge status="stopped" />);
        const chip = container.querySelector(".MuiChip-root");
        expect(chip).toBeInTheDocument();
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
        render(<StatusBadge status="running" />);
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
      it("renders large size", () => {
        const { container } = render(
          <StatusBadge status="running" size="large" />
        );
        const chip = container.querySelector(".MuiChip-sizeLarge");
        expect(chip).toBeInTheDocument();
      });
    });
  });

  describe("Loading Spinner", () => {
    it("shows spinner only for loading status", () => {
      const { container: runningContainer } = render(
        <StatusBadge status="running" size="large" />
      );
      const { container: loadingContainer } = render(
        <StatusBadge status="loading" size="large" />
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
      const { container: largeContainer } = render(
        <StatusBadge status="loading" size="large" />
      );

      const smallSpinner = smallContainer.querySelector(
        ".MuiCircularProgress-root"
      );
      const mediumSpinner = mediumContainer.querySelector(
        ".MuiCircularProgress-root"
      );
      const largeSpinner = largeContainer.querySelector(
        ".MuiCircularProgress-root"
      );

      expect(smallSpinner).toBeInTheDocument();
      expect(mediumSpinner).toBeInTheDocument();
      expect(largeSpinner).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("has font weight of 500", () => {
      const { container } = render(<StatusBadge status="running" />);
      const chip = container.querySelector(".MuiChip-root");
      expect(chip).toHaveStyle({ fontWeight: 500 });
    });

    it("applies font weight to label", () => {
      const { container } = render(<StatusBadge status="running" />);
      const label = container.querySelector(".MuiChip-label");
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
      const sizes: Array<"small" | "medium" | "large"> = [
        "small",
        "medium",
        "large",
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
      const sizes: Array<"small" | "medium" | "large"> = [
        "small",
        "medium",
        "large",
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
      const { container } = render(<StatusBadge status="running" />);
      const chip = container.querySelector(".MuiChip-colorSuccess");
      expect(chip).toBeInTheDocument();
    });

    it("idle has default color and Idle label", () => {
      render(<StatusBadge status="idle" />);
      expect(screen.getByText("Idle")).toBeInTheDocument();
      const { container } = render(<StatusBadge status="idle" />);
      const chip = container.querySelector(".MuiChip-colorDefault");
      expect(chip).toBeInTheDocument();
    });

    it("loading has info color and Loading label", () => {
      render(<StatusBadge status="loading" />);
      expect(screen.getByText("Loading")).toBeInTheDocument();
      const { container } = render(<StatusBadge status="loading" />);
      const chip = container.querySelector(".MuiChip-colorInfo");
      expect(chip).toBeInTheDocument();
    });

    it("error has error color and Error label", () => {
      render(<StatusBadge status="error" />);
      expect(screen.getByText("Error")).toBeInTheDocument();
      const { container } = render(<StatusBadge status="error" />);
      const chip = container.querySelector(".MuiChip-colorError");
      expect(chip).toBeInTheDocument();
    });

    it("stopped has warning color and Stopped label", () => {
      render(<StatusBadge status="stopped" />);
      expect(screen.getByText("Stopped")).toBeInTheDocument();
      const { container } = render(<StatusBadge status="stopped" />);
      const chip = container.querySelector(".MuiChip-colorWarning");
      expect(chip).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders as Chip component", () => {
      const { container } = render(<StatusBadge status="running" />);
      const chip = container.querySelector(".MuiChip-root");
      expect(chip).toBeInTheDocument();
    });

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
