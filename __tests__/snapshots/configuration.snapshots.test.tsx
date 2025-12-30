import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock dependencies

jest.mock("@/styles/theme", () => {
  const lightTheme = {
    palette: { mode: "light" },
    typography: {},
    components: {},
  };
  const darkTheme = {
    palette: { mode: "dark" },
    typography: {},
    components: {},
  };
  return {
    lightTheme,
    darkTheme,
  };
});

jest.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
    theme: "light",
  }),
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  m: {
    div: (props: any) => React.createElement('div', props),
  },
}));

// Mock useLoggerConfig hook
jest.mock("@/hooks/use-logger-config", () => ({
  useLoggerConfig: jest.fn(() => ({
    loggerConfig: {
      level: "info",
      file: true,
      console: true,
    },
    updateConfig: jest.fn(),
    loading: false,
    clearFieldError: jest.fn(),
  })),
}));

// Mock the configuration hooks
jest.mock("@/components/configuration/hooks/useConfigurationForm", () => ({
  useConfigurationForm: jest.fn(() => ({
    config: {
      serverPort: 8080,
      host: "localhost",
      contextLength: 2048,
      threads: 4,
      modelPath: "/models",
      cacheSize: 2,
    },
    loading: false,
    activeTab: 0,
    formConfig: {
      serverPort: 8080,
      host: "localhost",
      contextLength: 2048,
      threads: 4,
      modelPath: "/models",
      cacheSize: 2,
    },
    validationErrors: {},
    fieldErrors: {
      general: {},
      llamaServer: {},
      advanced: {},
    },
    isSaving: false,
    saveSuccess: null,
    handleTabChange: jest.fn(),
    handleInputChange: jest.fn(),
    handleLlamaServerChange: jest.fn(),
    handleSave: jest.fn(),
    handleReset: jest.fn(),
    handleSync: jest.fn(),
  })),
}));

import ModernConfiguration from "@/components/configuration/ModernConfiguration";
import { GeneralSettingsTab } from "@/components/configuration/GeneralSettingsTab";
import { LlamaServerSettingsTab } from "@/components/configuration/LlamaServerSettingsTab";
import { AdvancedSettingsTab } from "@/components/configuration/AdvancedSettingsTab";
import { LoggerSettingsTab } from "@/components/configuration/LoggerSettingsTab";
import { ConfigurationTabs } from "@/components/configuration/ConfigurationTabs";
import { ConfigurationStatusMessages } from "@/components/configuration/ConfigurationStatusMessages";
import { ConfigurationActions } from "@/components/configuration/ConfigurationActions";
import { ConfigurationHeader } from "@/components/configuration/ConfigurationHeader";

describe("Configuration Snapshots", () => {
  const MockThemeProvider = ({ children, isDark }: { children: React.ReactNode; isDark?: boolean }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  const mockFormConfig = {
    serverPort: 8080,
    host: "localhost",
    contextLength: 2048,
    threads: 4,
    modelPath: "/models",
    cacheSize: 2,
  };

  const mockValidationErrors = [
    "Port must be between 1-65535",
    "Context length must be positive",
  ];

  const mockFieldErrors = {
    general: {},
    llamaServer: {},
    advanced: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ModernConfiguration Component", () => {
    // Positive Test: Verify loading state
    it("should match snapshot with loading state", () => {
      const { useConfigurationForm } = require("@/components/configuration/hooks/useConfigurationForm");
      useConfigurationForm.mockReturnValue({
        config: {},
        loading: true,
        activeTab: 0,
        formConfig: {},
        validationErrors: {},
        isSaving: false,
        saveSuccess: null,
        handleTabChange: jest.fn(),
        handleInputChange: jest.fn(),
        handleLlamaServerChange: jest.fn(),
        handleSave: jest.fn(),
        handleReset: jest.fn(),
        handleSync: jest.fn(),
      });

      const { container } = render(
        <MockThemeProvider>
          <ModernConfiguration />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-loading");
    });

    // Positive Test: Verify with General tab active
    it("should match snapshot with General tab active", () => {
      const { container } = render(
        <MockThemeProvider>
          <ModernConfiguration />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-general-tab");
    });

    // Positive Test: Verify with LlamaServer tab active
    it("should match snapshot with LlamaServer tab active", () => {
      const { useConfigurationForm } = require("@/components/configuration/hooks/useConfigurationForm");
      useConfigurationForm.mockReturnValue({
        config: {},
        loading: false,
        activeTab: 1,
        formConfig: {},
        validationErrors: {},
        fieldErrors: {
          general: {},
          llamaServer: {},
          advanced: {},
        },
        isSaving: false,
        saveSuccess: null,
        handleTabChange: jest.fn(),
        handleInputChange: jest.fn(),
        handleLlamaServerChange: jest.fn(),
        handleSave: jest.fn(),
        handleReset: jest.fn(),
        handleSync: jest.fn(),
      });

      const { container } = render(
        <MockThemeProvider>
          <ModernConfiguration />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-llama-server-tab");
    });

    // Positive Test: Verify with Advanced tab active
    it("should match snapshot with Advanced tab active", () => {
      const { useConfigurationForm } = require("@/components/configuration/hooks/useConfigurationForm");
      useConfigurationForm.mockReturnValue({
        config: {},
        loading: false,
        activeTab: 2,
        formConfig: {},
        validationErrors: {},
        isSaving: false,
        saveSuccess: null,
        handleTabChange: jest.fn(),
        handleInputChange: jest.fn(),
        handleLlamaServerChange: jest.fn(),
        handleSave: jest.fn(),
        handleReset: jest.fn(),
        handleSync: jest.fn(),
      });

      const { container } = render(
        <MockThemeProvider>
          <ModernConfiguration />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-advanced-tab");
    });

    // Positive Test: Verify with Logger tab active
    it("should match snapshot with Logger tab active", () => {
      const { useConfigurationForm } = require("@/components/configuration/hooks/useConfigurationForm");
      useConfigurationForm.mockReturnValue({
        config: {},
        loading: false,
        activeTab: 3,
        formConfig: {},
        validationErrors: {},
        fieldErrors: {
          general: {},
          llamaServer: {},
          advanced: {},
        },
        isSaving: false,
        saveSuccess: null,
        handleTabChange: jest.fn(),
        handleInputChange: jest.fn(),
        handleLlamaServerChange: jest.fn(),
        handleSave: jest.fn(),
        handleReset: jest.fn(),
        handleSync: jest.fn(),
      });

      const { container } = render(
        <MockThemeProvider>
          <ModernConfiguration />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-logger-tab");
    });
  });

  describe("GeneralSettingsTab Component", () => {
    // Positive Test: Verify in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <GeneralSettingsTab formConfig={mockFormConfig} onInputChange={jest.fn()} fieldErrors={mockFieldErrors.general} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("general-settings-light");
    });

    // Positive Test: Verify in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <GeneralSettingsTab formConfig={mockFormConfig} onInputChange={jest.fn()} fieldErrors={mockFieldErrors.general} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("general-settings-dark");
    });

    // Negative Test: Verify with validation errors
    it("should match snapshot with validation errors", () => {
      const { container } = render(
        <MockThemeProvider>
          <GeneralSettingsTab
            formConfig={{ ...mockFormConfig, serverPort: 99999 }}
            onInputChange={jest.fn()}
            fieldErrors={mockFieldErrors.general}
          />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("general-settings-errors");
    });
  });

  describe("LlamaServerSettingsTab Component", () => {
    // Positive Test: Verify in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <LlamaServerSettingsTab formConfig={mockFormConfig} onLlamaServerChange={jest.fn()} fieldErrors={mockFieldErrors.llamaServer} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("llama-server-light");
    });

    // Positive Test: Verify in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <LlamaServerSettingsTab formConfig={mockFormConfig} onLlamaServerChange={jest.fn()} fieldErrors={mockFieldErrors.llamaServer} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("llama-server-dark");
    });

    // Negative Test: Verify with invalid configuration
    it("should match snapshot with invalid config", () => {
      const { container } = render(
        <MockThemeProvider>
          <LlamaServerSettingsTab
            formConfig={{ ...mockFormConfig, modelPath: "" }}
            onLlamaServerChange={jest.fn()}
            fieldErrors={mockFieldErrors.llamaServer}
          />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("llama-server-invalid");
    });
  });

  describe("AdvancedSettingsTab Component", () => {
    // Positive Test: Verify in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <AdvancedSettingsTab isSaving={false} onReset={jest.fn()} onSync={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("advanced-settings-light");
    });

    // Positive Test: Verify in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <AdvancedSettingsTab isSaving={false} onReset={jest.fn()} onSync={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("advanced-settings-dark");
    });

    // Positive Test: Verify while saving
    it("should match snapshot while saving", () => {
      const { container } = render(
        <MockThemeProvider>
          <AdvancedSettingsTab isSaving={true} onReset={jest.fn()} onSync={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("advanced-settings-saving");
    });
  });

  describe("LoggerSettingsTab Component", () => {
    // Positive Test: Verify in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <LoggerSettingsTab />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logger-settings-light");
    });

    // Positive Test: Verify in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <LoggerSettingsTab />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logger-settings-dark");
    });
  });

  describe("ConfigurationTabs Component", () => {
    // Positive Test: Verify General tab active
    it("should match snapshot with General tab active", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationTabs activeTab={0} onChange={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("tabs-general");
    });

    // Positive Test: Verify LlamaServer tab active
    it("should match snapshot with LlamaServer tab active", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationTabs activeTab={1} onChange={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("tabs-llama-server");
    });

    // Positive Test: Verify Advanced tab active
    it("should match snapshot with Advanced tab active", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationTabs activeTab={2} onChange={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("tabs-advanced");
    });

    // Positive Test: Verify Logger tab active
    it("should match snapshot with Logger tab active", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationTabs activeTab={3} onChange={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("tabs-logger");
    });
  });

  describe("ConfigurationStatusMessages Component", () => {
    // Positive Test: Verify success message
    it("should match snapshot with success message", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationStatusMessages saveSuccess={true} validationErrors={[]} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("status-success");
    });

    // Negative Test: Verify error message
    it("should match snapshot with error message", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationStatusMessages saveSuccess={false} validationErrors={[]} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("status-error");
    });

    // Negative Test: Verify with validation errors
    it("should match snapshot with validation errors", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationStatusMessages saveSuccess={false} validationErrors={mockValidationErrors} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("status-validation-errors");
    });

    // Positive Test: Verify with no messages
    it("should match snapshot with no messages", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationStatusMessages saveSuccess={false} validationErrors={[]} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("status-none");
    });
  });

  describe("ConfigurationActions Component", () => {
    // Positive Test: Verify normal state
    it("should match snapshot in normal state", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationActions isSaving={false} onSave={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("actions-normal");
    });

    // Positive Test: Verify saving state
    it("should match snapshot in saving state", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationActions isSaving={true} onSave={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("actions-saving");
    });
  });

  describe("ConfigurationHeader Component", () => {
    // Positive Test: Verify header rendering
    it("should match snapshot header", () => {
      const { container } = render(
        <MockThemeProvider>
          <ConfigurationHeader />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-header");
    });
  });

  describe("Responsive Configuration Layouts", () => {
    // Positive Test: Verify mobile layout
    it("should match snapshot at mobile width (375px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
      const { container } = render(
        <MockThemeProvider>
          <ModernConfiguration />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-mobile");
    });

    // Positive Test: Verify tablet layout
    it("should match snapshot at tablet width (768px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 768 });
      const { container } = render(
        <MockThemeProvider>
          <ModernConfiguration />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-tablet");
    });

    // Positive Test: Verify desktop layout
    it("should match snapshot at desktop width (1024px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
      const { container } = render(
        <MockThemeProvider>
          <ModernConfiguration />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-desktop");
    });

    // Positive Test: Verify large desktop layout
    it("should match snapshot at large desktop width (1440px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1440 });
      const { container } = render(
        <MockThemeProvider>
          <ModernConfiguration />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-large-desktop");
    });
  });

  describe("Form States", () => {
    // Positive Test: Verify pristine form
    it("should match snapshot with pristine form", () => {
      const { container } = render(
        <MockThemeProvider>
          <GeneralSettingsTab formConfig={mockFormConfig} onInputChange={jest.fn()} fieldErrors={mockFieldErrors.general} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("form-pristine");
    });

    // Positive Test: Verify dirty form
    it("should match snapshot with dirty form", () => {
      const dirtyConfig = { ...mockFormConfig, serverPort: 9090 };
      const { container } = render(
        <MockThemeProvider>
          <GeneralSettingsTab formConfig={dirtyConfig} onInputChange={jest.fn()} fieldErrors={mockFieldErrors.general} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("form-dirty");
    });

    // Negative Test: Verify invalid form
    it("should match snapshot with invalid form", () => {
      const invalidConfig = { ...mockFormConfig, serverPort: 0, contextLength: -100 };
      const { container } = render(
        <MockThemeProvider>
          <GeneralSettingsTab formConfig={invalidConfig} onInputChange={jest.fn()} fieldErrors={mockFieldErrors.general} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("form-invalid");
    });

    // Positive Test: Verify valid form
    it("should match snapshot with valid form", () => {
      const { container } = render(
        <MockThemeProvider>
          <GeneralSettingsTab formConfig={mockFormConfig} onInputChange={jest.fn()} fieldErrors={mockFieldErrors.general} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("form-valid");
    });
  });

  describe("Accessibility in Configuration", () => {
    // Positive Test: Verify tab navigation is accessible
    it("should have accessible tab navigation", () => {
      render(
        <MockThemeProvider>
          <ConfigurationTabs activeTab={0} onChange={jest.fn()} />
        </MockThemeProvider>
      );
      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBeGreaterThan(0);
    });

    // Positive Test: Verify form labels are present
    it("should have form labels present", () => {
      render(
        <MockThemeProvider>
          <GeneralSettingsTab formConfig={mockFormConfig} onInputChange={jest.fn()} fieldErrors={mockFieldErrors.general} />
        </MockThemeProvider>
      );
      expect(screen.getByLabelText(/server port/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/host/i)).toBeInTheDocument();
    });

    // Positive Test: Verify status messages are accessible
    it("should have accessible status messages", () => {
      render(
        <MockThemeProvider>
          <ConfigurationStatusMessages saveSuccess={true} validationErrors={[]} />
        </MockThemeProvider>
      );
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });
  });
});
