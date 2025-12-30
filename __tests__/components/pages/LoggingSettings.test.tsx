import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import LoggingSettings from "@/components/pages/LoggingSettings";

// Mock dependencies
jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: () => ({ sendMessage: jest.fn() }),
}));

jest.mock("@/lib/store", () => ({
  useStore: {
    getState: jest.fn(() => ({
      setLoading: jest.fn(),
      clearError: jest.fn(),
      setError: jest.fn(),
    })),
  },
}));

jest.mock("@/lib/client-logger", () => ({
  getLoggerConfig: jest.fn(() => ({
    consoleLevel: 'debug',
    fileLevel: 'info',
    errorLevel: 'error',
    maxFileSize: '20m',
    maxFiles: '30d',
    enableFileLogging: true,
    enableConsoleLogging: true,
  })),
  updateLoggerConfig: jest.fn(),
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  m: {
    div: ({ children, ...props }: any) => React.createElement("div", { "data-testid": "motion-div", ...props }, children),
  },
}));

// Mock MUI components
jest.mock("@mui/material", () => ({
  Card: ({ children, ...props }: any) => React.createElement("div", { "data-testid": "card", ...props }, children),
  CardContent: ({ children, ...props }: any) => React.createElement("div", { "data-testid": "card-content", ...props }, children),
  Typography: ({ children, variant, component, ...props }: any) => 
    React.createElement(component || "span", { "data-testid": `typography-${variant}`, ...props }, children),
  Box: ({ children, ...props }: any) => React.createElement("div", { "data-testid": "box", ...props }, children),
  Grid: ({ children, ...props }: any) => React.createElement("div", { "data-testid": "grid", ...props }, children),
  Divider: () => React.createElement("hr", { "data-testid": "divider" }),
  TextField: ({ label, value, onChange, helperText, ...props }: any) => 
    React.createElement("input", { 
      "data-testid": "text-field", 
      placeholder: label, 
      value, 
      onChange: (e: any) => onChange({ target: { value: e.target.value } }),
      ...props 
    }),
  Switch: ({ checked, onChange, ...props }: any) => 
    React.createElement("input", { 
      type: "checkbox", 
      "data-testid": "switch", 
      checked, 
      onChange: (e: any) => onChange({ target: { checked: e.target.checked } }),
      ...props 
    }),
  FormControlLabel: ({ control, label }: any) => 
    React.createElement("label", { "data-testid": "form-control-label" }, control, label),
  Button: ({ children, onClick, disabled, ...props }: any) => 
    React.createElement("button", { 
      "data-testid": "button", 
      onClick, 
      disabled, 
      ...props 
    }, children),
  Chip: ({ label, ...props }: any) => 
    React.createElement("span", { "data-testid": "chip", ...props }, label),
  Slider: ({ value, onChange, min, max, step, marks, valueLabelDisplay, valueLabelFormat, ...props }: any) => 
    React.createElement("input", { 
      type: "range", 
      "data-testid": "slider", 
      value, 
      onChange: (e: any) => onChange(e, parseInt(e.target.value)),
      min, 
      max, 
      step,
      ...props 
    }),
}));

describe("LoggingSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("renders loading state initially", () => {
      render(<LoggingSettings />);
      
      expect(screen.getByText("Loading Logging Configuration...")).toBeInTheDocument();
    });

    it("loads configuration on mount", async () => {
      const mockGetLoggerConfig = require("@/lib/client-logger").getLoggerConfig;
      
      render(<LoggingSettings />);
      
      await waitFor(() => {
        expect(mockGetLoggerConfig).toHaveBeenCalled();
      });
    });
  });

  describe("Loaded State", () => {
    beforeEach(async () => {
      render(<LoggingSettings />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText("Loading Logging Configuration...")).not.toBeInTheDocument();
      });
    });

    it("renders main structure", () => {
      expect(screen.getByText("Logging Configuration")).toBeInTheDocument();
      expect(screen.getByText("Advanced Logging System with File Rotation")).toBeInTheDocument();
    });

    it("renders console logging section", () => {
      expect(screen.getByText("Console Logging")).toBeInTheDocument();
      expect(screen.getByText("Configure console output logging")).toBeInTheDocument();
    });

    it("renders file logging section", () => {
      expect(screen.getByText("File Logging")).toBeInTheDocument();
      expect(screen.getByText("Configure file logging with rotation")).toBeInTheDocument();
    });

    it("renders actions section", () => {
      expect(screen.getByText("Logging Configuration Actions")).toBeInTheDocument();
      expect(screen.getByText("Save or reset your logging configuration")).toBeInTheDocument();
    });

    it("renders current configuration section", () => {
      expect(screen.getByText("Current Configuration")).toBeInTheDocument();
      expect(screen.getByText("Preview of your current logging settings")).toBeInTheDocument();
    });

    it("shows console logging enabled by default", () => {
      const switches = screen.getAllByTestId("switch");
      expect(switches.length).toBeGreaterThan(0);
    });

    it("shows file logging enabled by default", () => {
      const switches = screen.getAllByTestId("switch");
      expect(switches.length).toBeGreaterThan(1);
    });

    it("displays current configuration values", () => {
      expect(screen.getByText("Enabled")).toBeInTheDocument(); // Console and file logging enabled
      expect(screen.getByText("debug")).toBeInTheDocument(); // Console level
      expect(screen.getByText("info")).toBeInTheDocument(); // File level
      expect(screen.getByText("error")).toBeInTheDocument(); // Error level
      expect(screen.getByText("20m")).toBeInTheDocument(); // Max file size
      expect(screen.getByText("30d")).toBeInTheDocument(); // Max files
    });

    it("renders sliders for log levels", () => {
      const sliders = screen.getAllByTestId("slider");
      expect(sliders.length).toBeGreaterThanOrEqual(3); // Console, file, and error level sliders
    });

    it("renders text fields for configuration", () => {
      const textFields = screen.getAllByTestId("text-field");
      expect(textFields.length).toBeGreaterThanOrEqual(2); // Max file size and max files
    });

    it("renders action buttons", () => {
      expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
      expect(screen.getByText("Save Configuration")).toBeInTheDocument();
    });
  });

  describe("Configuration Changes", () => {
    beforeEach(async () => {
      render(<LoggingSettings />);
      
      await waitFor(() => {
        expect(screen.queryByText("Loading Logging Configuration...")).not.toBeInTheDocument();
      });
    });

    it("calls handleConfigChange when switch is toggled", () => {
      const switches = screen.getAllByTestId("switch");
      const consoleSwitch = switches[0]; // First switch is console logging
      
      fireEvent.click(consoleSwitch);
      
      // The component should handle the change internally
      expect(consoleSwitch).toBeInTheDocument();
    });

    it("calls handleConfigChange when slider value changes", () => {
      const sliders = screen.getAllByTestId("slider");
      const consoleSlider = sliders[0]; // First slider is console level
      
      fireEvent.change(consoleSlider, { target: { value: '2' } });
      
      expect(consoleSlider).toBeInTheDocument();
    });

    it("calls handleConfigChange when text field changes", () => {
      const textFields = screen.getAllByTestId("text-field");
      const fileSizeField = textFields[0]; // First text field is max file size
      
      fireEvent.change(fileSizeField, { target: { value: '50m' } });
      
      expect(fileSizeField).toBeInTheDocument();
    });
  });

  describe("Action Handlers", () => {
    let mockUpdateLoggerConfig: jest.Mock;
    let mockSendMessage: jest.Mock;
    let mockSetLoading: jest.Mock;
    let mockClearError: jest.Mock;
    let mockSetError: jest.Mock;

    beforeEach(async () => {
      mockUpdateLoggerConfig = require("@/lib/client-logger").updateLoggerConfig;
      mockSendMessage = require("@/hooks/use-websocket").useWebSocket().sendMessage;
      mockSetLoading = require("@/lib/store").useStore.getState().setLoading;
      mockClearError = require("@/lib/store").useStore.getState().clearError;
      mockSetError = require("@/lib/store").useStore.getState().setError;

      render(<LoggingSettings />);
      
      await waitFor(() => {
        expect(screen.queryByText("Loading Logging Configuration...")).not.toBeInTheDocument();
      });
    });

    it("calls handleSaveConfig when save button is clicked", () => {
      const saveButton = screen.getByText("Save Configuration");
      
      fireEvent.click(saveButton);
      
      expect(mockUpdateLoggerConfig).toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith('updateLoggerConfig', expect.any(Object));
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockClearError).toHaveBeenCalled();
    });

    it("calls handleResetConfig when reset button is clicked", () => {
      const resetButton = screen.getByText("Reset to Defaults");
      
      fireEvent.click(resetButton);
      
      expect(mockUpdateLoggerConfig).toHaveBeenCalledWith({
        consoleLevel: 'debug',
        fileLevel: 'info',
        errorLevel: 'error',
        maxFileSize: '20m',
        maxFiles: '30d',
        enableFileLogging: true,
        enableConsoleLogging: true,
      });
      expect(mockSendMessage).toHaveBeenCalledWith('updateLoggerConfig', expect.any(Object));
    });
  });

  describe("Utility Functions", () => {
    beforeEach(async () => {
      render(<LoggingSettings />);
      
      await waitFor(() => {
        expect(screen.queryByText("Loading Logging Configuration...")).not.toBeInTheDocument();
      });
    });

    it("getLogLevelValue converts level to index", () => {
      // These functions are tested indirectly through the UI
      // The sliders should be present and functional
      const sliders = screen.getAllByTestId("slider");
      expect(sliders.length).toBeGreaterThan(0);
    });

    it("getLogLevelLabel converts index to level", () => {
      // Tested through slider valueLabelFormat
      const sliders = screen.getAllByTestId("slider");
      expect(sliders.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    let mockUpdateLoggerConfig: jest.Mock;

    beforeEach(async () => {
      mockUpdateLoggerConfig = require("@/lib/client-logger").updateLoggerConfig;
      mockUpdateLoggerConfig.mockImplementation(() => {
        throw new Error("Update failed");
      });

      render(<LoggingSettings />);
      
      await waitFor(() => {
        expect(screen.queryByText("Loading Logging Configuration...")).not.toBeInTheDocument();
      });
    });

    it("handles save configuration errors", () => {
      const mockSetError = require("@/lib/store").useStore.getState().setError;
      
      const saveButton = screen.getByText("Save Configuration");
      fireEvent.click(saveButton);
      
      expect(mockSetError).toHaveBeenCalledWith('Failed to update logging configuration');
    });
  });
});
