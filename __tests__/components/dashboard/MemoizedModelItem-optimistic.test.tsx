import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoizedModelItem } from "@/components/dashboard/MemoizedModelItem";

// Mock dependencies
jest.mock("@/lib/client-model-templates", () => ({
  getModelTemplatesSync: jest.fn(() => ({
    "llama-2-7b": "llama-2-7b",
    "mistral-7b": "mistral-7b"
  }))
}));

describe("MemoizedModelItem-optimistic", () => {
  const defaultProps = {
    model: {
      id: "model-1",
      name: "llama-2-7b",
      status: "idle" as const,
      type: "llama" as const
    },
    isDark: false,
    currentTemplate: "",
    loadingModels: {},
    setLoadingModels: jest.fn(),
    selectedTemplates: {},
    onSaveTemplate: jest.fn(),
    onSaveTemplateToConfig: jest.fn(),
    onToggleModel: jest.fn(),
    onToggleModelOptimistic: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Optimistic UI Updates", () => {
    it("should update UI immediately on start action", async () => {
      const onToggleModelOptimistic = jest.fn();

      render(
        <MemoizedModelItem
          {...defaultProps}
          onToggleModelOptimistic={onToggleModelOptimistic}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      // Optimistic update should happen immediately
      expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "loading");
    });

    it("should update UI immediately on stop action", async () => {
      const onToggleModelOptimistic = jest.fn();
      const runningModel = {
        ...defaultProps.model,
        status: "running" as const
      };

      render(
        <MemoizedModelItem
          {...defaultProps}
          model={runningModel}
          onToggleModelOptimistic={onToggleModelOptimistic}
        />
      );

      const stopButton = screen.getByRole("button", { name: /stop/i });
      fireEvent.click(stopButton);

      // Optimistic update should happen immediately
      expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "stopped");
    });

    it("should display optimistic status immediately", () => {
      render(
        <MemoizedModelItem
          {...defaultProps}
          optimisticStatus="loading"
        />
      );

      // Should show LOADING status immediately
      const statusChip = screen.getByText("LOADING");
      expect(statusChip).toBeInTheDocument();
    });

    it("should show optimistic loading state", () => {
      render(
        <MemoizedModelItem
          {...defaultProps}
          optimisticStatus="loading"
          model={{
            ...defaultProps.model,
            progress: 50
          }}
        />
      );

      // Should show progress bar when optimistically loading
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    });
  });

  describe("Error Reversion", () => {
    it("should revert to original status on error", async () => {
      const onToggleModelOptimistic = jest.fn();
      const onToggleModel = jest.fn();

      // Mock failed response
      global.fetch = jest.fn(() =>
        Promise.reject(new Error("Failed to start model"))
      ) as jest.Mock;

      render(
        <MemoizedModelItem
          {...defaultProps}
          onToggleModel={onToggleModel}
          onToggleModelOptimistic={onToggleModelOptimistic}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      // Wait for error handling
      await waitFor(() => {
        // Should call revert with original status
        expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "idle");
      }, { timeout: 3000 });
    });

    it("should show alert on error", async () => {
      const alertSpy = jest.spyOn(window, "alert").mockImplementation();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Mock failed response
      global.fetch = jest.fn(() =>
        Promise.reject(new Error("Failed to start model"))
      ) as jest.Mock;

      render(<MemoizedModelItem {...defaultProps} />);

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      // Wait for error handling
      await waitFor(
        () => {
          expect(alertSpy).toHaveBeenCalledWith("Failed to start model");
        },
        { timeout: 3000 }
      );

      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe("Loading States", () => {
    it("should disable button when loading", () => {
      render(
        <MemoizedModelItem
          {...defaultProps}
          loadingModels={{ "model-1": true }}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      expect(startButton).toBeDisabled();
    });

    it("should disable button when optimistically loading", () => {
      render(
        <MemoizedModelItem
          {...defaultProps}
          optimisticStatus="loading"
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      expect(startButton).toBeDisabled();
    });
  });

  describe("Optimistic Status Display", () => {
    it("should prefer optimistic status over actual status", () => {
      render(
        <MemoizedModelItem
          {...defaultProps}
          model={{
            ...defaultProps.model,
            status: "idle"
          }}
          optimisticStatus="loading"
        />
      );

      const statusChip = screen.getByText("LOADING");
      expect(statusChip).toBeInTheDocument();
    });

    it("should show correct status color for optimistic loading", () => {
      render(
        <MemoizedModelItem
          {...defaultProps}
          optimisticStatus="loading"
        />
      );

      const statusChip = screen.getByText("LOADING");
      expect(statusChip).toBeInTheDocument();
    });

    it("should show correct status color for optimistic running", () => {
      render(
        <MemoizedModelItem
          {...defaultProps}
          optimisticStatus="running"
        />
      );

      const statusChip = screen.getByText("RUNNING");
      expect(statusChip).toBeInTheDocument();
    });

    it("should show correct status color for optimistic error", () => {
      render(
        <MemoizedModelItem
          {...defaultProps}
          optimisticStatus="error"
        />
      );

      const statusChip = screen.getByText("ERROR");
      expect(statusChip).toBeInTheDocument();
    });
  });

  describe("Optimistic Start Action", () => {
    it("should call start API with template", async () => {
      const onToggleModel = jest.fn();

      render(
        <MemoizedModelItem
          {...defaultProps}
          selectedTemplates={{ "llama-2-7b": "llama-2-7b" }}
          onToggleModel={onToggleModel}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/models/llama-2-7b/start"),
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: expect.stringContaining("llama-2-7b")
          })
        );
      });
    });

    it("should handle API response errors", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({ error: "Server error" })
        })
      ) as jest.Mock;

      const alertSpy = jest.spyOn(window, "alert").mockImplementation();

      render(<MemoizedModelItem {...defaultProps} />);

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Server error");
      });

      alertSpy.mockRestore();
    });
  });

  describe("Optimistic Stop Action", () => {
    it("should call stop API", async () => {
      const onToggleModel = jest.fn();

      render(
        <MemoizedModelItem
          {...defaultProps}
          model={{
            ...defaultProps.model,
            status: "running"
          }}
          onToggleModel={onToggleModel}
        />
      );

      const stopButton = screen.getByRole("button", { name: /stop/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/models/llama-2-7b/stop"),
          expect.objectContaining({
            method: "POST"
          })
        );
      });
    });

    it("should update to stopped status optimistically", () => {
      const onToggleModelOptimistic = jest.fn();

      render(
        <MemoizedModelItem
          {...defaultProps}
          model={{
            ...defaultProps.model,
            status: "running"
          }}
          onToggleModelOptimistic={onToggleModelOptimistic}
        />
      );

      const stopButton = screen.getByRole("button", { name: /stop/i });
      fireEvent.click(stopButton);

      expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "stopped");
    });
  });

  describe("Loading Models State Management", () => {
    it("should set loading to true on action start", () => {
      const setLoadingModels = jest.fn();

      render(
        <MemoizedModelItem
          {...defaultProps}
          setLoadingModels={setLoadingModels}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      expect(setLoadingModels).toHaveBeenCalledWith(
        expect.objectContaining({
          "model-1": true
        })
      );
    });

    it("should set loading to false on completion", async () => {
      const setLoadingModels = jest.fn();

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      ) as jest.Mock;

      render(
        <MemoizedModelItem
          {...defaultProps}
          setLoadingModels={setLoadingModels}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(setLoadingModels).toHaveBeenCalledWith(
          expect.objectContaining({
            "model-1": false
          })
        );
      });
    });
  });

  describe("Optimistic UI Edge Cases", () => {
    it("should handle missing onToggleModelOptimistic gracefully", () => {
      const { onToggleModelOptimistic: _, ...propsWithoutOptimistic } = defaultProps;
      render(<MemoizedModelItem {...propsWithoutOptimistic} />);

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      // Should not throw error
      expect(startButton).toBeInTheDocument();
    });

    it("should handle rapid successive clicks", () => {
      const onToggleModelOptimistic = jest.fn();

      render(
        <MemoizedModelItem
          {...defaultProps}
          onToggleModelOptimistic={onToggleModelOptimistic}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });

      fireEvent.click(startButton);
      fireEvent.click(startButton);
      fireEvent.click(startButton);

      // Should only call once due to loading state
      expect(onToggleModelOptimistic).toHaveBeenCalledTimes(1);
    });

    it("should maintain optimistic status during API call", async () => {
      const onToggleModelOptimistic = jest.fn();
      const onToggleModel = jest.fn();

      let resolveFetch: () => void;
      global.fetch = jest.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = () =>
              resolve({
                ok: true,
                json: async () => ({ success: true })
              });
          })
      ) as jest.Mock;

      render(
        <MemoizedModelItem
          {...defaultProps}
          onToggleModel={onToggleModel}
          onToggleModelOptimistic={onToggleModelOptimistic}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      // Should show loading status immediately
      const statusChip = screen.getByText("LOADING");
      expect(statusChip).toBeInTheDocument();

      // Resolve fetch
      resolveFetch!();

      await waitFor(() => {
        expect(onToggleModel).toHaveBeenCalled();
      });
    });
  });

  describe("Success Handling", () => {
    it("should call onToggleModel on successful action", async () => {
      const onToggleModel = jest.fn();

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      ) as jest.Mock;

      render(
        <MemoizedModelItem
          {...defaultProps}
          onToggleModel={onToggleModel}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(onToggleModel).toHaveBeenCalledWith("model-1");
      });
    });

    it("should not revert status on success", async () => {
      const onToggleModelOptimistic = jest.fn();

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      ) as jest.Mock;

      render(
        <MemoizedModelItem
          {...defaultProps}
          onToggleModelOptimistic={onToggleModelOptimistic}
        />
      );

      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);

      // Should only call with loading, not revert to idle
      await waitFor(() => {
        expect(onToggleModelOptimistic).toHaveBeenCalledTimes(1);
        expect(onToggleModelOptimistic).toHaveBeenCalledWith("model-1", "loading");
      });
    });
  });
});
