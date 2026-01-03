import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { LoggerSettingsTab } from "@/components/configuration/LoggerSettingsTab";
import {
  mockUpdateConfig,
  mockClearFieldError,
  defaultLoggerConfig,
  setupMocks,
  renderComponent,
} from "./LoggerSettingsTab.test.helpers";

jest.mock("framer-motion", () => ({
  m: {
    div: (props: unknown) => {
      const { children } = props as { children?: React.ReactNode };
      return <div>{children}</div>;
    },
  },
}));

jest.mock("@/hooks/use-logger-config", () => ({
  useLoggerConfig: jest.fn(),
}));

describe("LoggerSettingsTab - Error Handling", () => {
  beforeEach(() => {
    setupMocks();
  });

  // Field error rendering tests
  it("renders with fieldErrors prop populated - consoleLevel", () => {
    const fieldErrors = {
      consoleLevel: "Invalid log level",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Invalid log level")).toBeInTheDocument();
  });

  it("renders with fieldErrors prop populated - fileLevel", () => {
    const fieldErrors = {
      fileLevel: "Invalid file level",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Invalid file level")).toBeInTheDocument();
  });

  it("renders with fieldErrors prop populated - errorLevel", () => {
    const fieldErrors = {
      errorLevel: "Invalid error level",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Invalid error level")).toBeInTheDocument();
  });

  it("renders with fieldErrors prop populated - maxFileSize", () => {
    const fieldErrors = {
      maxFileSize: "Invalid file size",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Invalid file size")).toBeInTheDocument();
  });

  it("renders with fieldErrors prop populated - maxFiles", () => {
    const fieldErrors = {
      maxFiles: "Invalid retention period",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Invalid retention period")).toBeInTheDocument();
  });

  it("renders with multiple field errors", () => {
    const fieldErrors = {
      consoleLevel: "Invalid console level",
      fileLevel: "Invalid file level",
      errorLevel: "Invalid error level",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Invalid console level")).toBeInTheDocument();
    expect(screen.getByText("Invalid file level")).toBeInTheDocument();
    expect(screen.getByText("Invalid error level")).toBeInTheDocument();
  });

  it("shows error styling when fieldErrors are present", () => {
    const fieldErrors = {
      consoleLevel: "This field is required",
    };

    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    setupMocks(config);

    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    const selects = screen.getAllByRole("combobox");
    const consoleSelect = selects[0];
    expect(consoleSelect).toHaveClass("Mui-error");
  });

  // Error message rendering tests
  it("renders error message below console level select", () => {
    const fieldErrors = {
      consoleLevel: "Error message here",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Error message here")).toBeInTheDocument();
  });

  it("renders error message below file level select", () => {
    const fieldErrors = {
      fileLevel: "Error message here",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Error message here")).toBeInTheDocument();
  });

  it("renders error message below error level select", () => {
    const fieldErrors = {
      errorLevel: "Error message here",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Error message here")).toBeInTheDocument();
  });

  it("renders error message below max file size select", () => {
    const fieldErrors = {
      maxFileSize: "Error message here",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Error message here")).toBeInTheDocument();
  });

  it("renders error message below file retention select", () => {
    const fieldErrors = {
      maxFiles: "Error message here",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    expect(screen.getByText("Error message here")).toBeInTheDocument();
  });

  // Clear field error tests
  it("clears field error when console level is changed", () => {
    const fieldErrors = {
      consoleLevel: "Invalid value",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    const selects = screen.getAllByRole("combobox");
    const consoleSelect = selects[0];

    fireEvent.change(consoleSelect, { target: { value: "debug" } });

    expect(mockClearFieldError).toHaveBeenCalledWith("consoleLevel");
  });

  it("clears field error when file level is changed", () => {
    const fieldErrors = {
      fileLevel: "Invalid value",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    const selects = screen.getAllByRole("combobox");
    const fileSelect = selects[1];

    fireEvent.change(fileSelect, { target: { value: "debug" } });

    expect(mockClearFieldError).toHaveBeenCalledWith("fileLevel");
  });

  it("clears field error when error level is changed", () => {
    const fieldErrors = {
      errorLevel: "Invalid value",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    const selects = screen.getAllByRole("combobox");
    const errorSelect = selects[2];

    fireEvent.change(errorSelect, { target: { value: "warn" } });

    expect(mockClearFieldError).toHaveBeenCalledWith("errorLevel");
  });

  it("clears field error when max file size is changed", () => {
    const fieldErrors = {
      maxFileSize: "Invalid value",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    const selects = screen.getAllByRole("combobox");
    const maxSizeSelect = selects[3];

    fireEvent.change(maxSizeSelect, { target: { value: "50m" } });

    expect(mockClearFieldError).toHaveBeenCalledWith("maxFileSize");
  });

  it("clears field error when file retention is changed", () => {
    const fieldErrors = {
      maxFiles: "Invalid value",
    };
    renderComponent(<LoggerSettingsTab fieldErrors={fieldErrors} />);

    const selects = screen.getAllByRole("combobox");
    const retentionSelect = selects[4];

    fireEvent.change(retentionSelect, { target: { value: "60d" } });

    expect(mockClearFieldError).toHaveBeenCalledWith("maxFiles");
  });
});
