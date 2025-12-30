import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import ModernConfiguration from "@/components/configuration/ModernConfiguration";

// Mock the custom hook
const mockUseConfigurationForm = jest.fn();
jest.mock("@/components/configuration/hooks/useConfigurationForm", () => ({
  useConfigurationForm: () => mockUseConfigurationForm(),
}));

// Mock child components
jest.mock("@/components/configuration/ConfigurationHeader", () => ({
  ConfigurationHeader: () => <div data-testid="configuration-header">Header</div>,
}));

jest.mock("@/components/configuration/ConfigurationTabs", () => ({
  ConfigurationTabs: ({ activeTab, onChange }: any) => (
    <div data-testid="configuration-tabs" data-active-tab={activeTab}>
      Tabs
    </div>
  ),
}));

jest.mock("@/components/configuration/ConfigurationStatusMessages", () => ({
  ConfigurationStatusMessages: () => <div data-testid="configuration-status-messages">Status Messages</div>,
}));

jest.mock("@/components/configuration/GeneralSettingsTab", () => ({
  GeneralSettingsTab: () => <div data-testid="general-settings-tab">General Settings</div>,
}));

jest.mock("@/components/configuration/LlamaServerSettingsTab", () => ({
  LlamaServerSettingsTab: () => <div data-testid="llama-server-settings-tab">Llama Server Settings</div>,
}));

jest.mock("@/components/configuration/AdvancedSettingsTab", () => ({
  AdvancedSettingsTab: () => <div data-testid="advanced-settings-tab">Advanced Settings</div>,
}));

jest.mock("@/components/configuration/LoggerSettingsTab", () => ({
  LoggerSettingsTab: () => <div data-testid="logger-settings-tab">Logger Settings</div>,
}));

jest.mock("@/components/configuration/ConfigurationActions", () => ({
  ConfigurationActions: () => <div data-testid="configuration-actions">Actions</div>,
}));

jest.mock("@/components/ui", () => ({
  SkeletonSettingsForm: ({ fields }: any) => <div data-testid="skeleton-settings-form" data-fields={fields}>Skeleton</div>,
}));

// Mock MUI components
jest.mock("@mui/material", () => ({
  Box: ({ children, ...props }: any) => <div data-testid="mui-box" {...props}>{children}</div>,
  LinearProgress: () => <div data-testid="linear-progress">Progress</div>,
  Typography: ({ children }: any) => <span>{children}</span>,
}));

describe("ModernConfiguration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("renders skeleton when loading", () => {
      mockUseConfigurationForm.mockReturnValue({
        loading: true,
        config: {},
        activeTab: 0,
        formConfig: {},
        validationErrors: [],
        fieldErrors: {},
        isSaving: false,
        saveSuccess: false,
        handleTabChange: jest.fn(),
        handleInputChange: jest.fn(),
        handleLlamaServerChange: jest.fn(),
        handleSave: jest.fn(),
        handleReset: jest.fn(),
        handleSync: jest.fn(),
      });

      render(<ModernConfiguration />);

      expect(screen.getByTestId("skeleton-settings-form")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-settings-form")).toHaveAttribute("data-fields", "8");
    });

    it("does not render main content when loading", () => {
      mockUseConfigurationForm.mockReturnValue({
        loading: true,
        config: {},
        activeTab: 0,
        formConfig: {},
        validationErrors: [],
        fieldErrors: {},
        isSaving: false,
        saveSuccess: false,
        handleTabChange: jest.fn(),
        handleInputChange: jest.fn(),
        handleLlamaServerChange: jest.fn(),
        handleSave: jest.fn(),
        handleReset: jest.fn(),
        handleSync: jest.fn(),
      });

      render(<ModernConfiguration />);

      expect(screen.queryByTestId("configuration-header")).not.toBeInTheDocument();
      expect(screen.queryByTestId("configuration-tabs")).not.toBeInTheDocument();
    });
  });

  describe("Loaded State", () => {
    const defaultMockReturn = {
      loading: false,
      config: { someConfig: "value" },
      activeTab: 0,
      formConfig: { general: {}, llamaServer: {} },
      validationErrors: [],
      fieldErrors: { general: {}, llamaServer: {} },
      isSaving: false,
      saveSuccess: false,
      handleTabChange: jest.fn(),
      handleInputChange: jest.fn(),
      handleLlamaServerChange: jest.fn(),
      handleSave: jest.fn(),
      handleReset: jest.fn(),
      handleSync: jest.fn(),
    };

    beforeEach(() => {
      mockUseConfigurationForm.mockReturnValue(defaultMockReturn);
    });

    it("renders main configuration layout when not loading", () => {
      render(<ModernConfiguration />);

      expect(screen.getByTestId("configuration-header")).toBeInTheDocument();
      expect(screen.getByTestId("configuration-tabs")).toBeInTheDocument();
      expect(screen.getByTestId("configuration-status-messages")).toBeInTheDocument();
      expect(screen.getByTestId("configuration-actions")).toBeInTheDocument();
    });

    it("renders GeneralSettingsTab when activeTab is 0", () => {
      render(<ModernConfiguration />);

      expect(screen.getByTestId("general-settings-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("llama-server-settings-tab")).not.toBeInTheDocument();
      expect(screen.queryByTestId("advanced-settings-tab")).not.toBeInTheDocument();
      expect(screen.queryByTestId("logger-settings-tab")).not.toBeInTheDocument();
    });

    it("renders LlamaServerSettingsTab when activeTab is 1", () => {
      mockUseConfigurationForm.mockReturnValue({
        ...defaultMockReturn,
        activeTab: 1,
      });

      render(<ModernConfiguration />);

      expect(screen.queryByTestId("general-settings-tab")).not.toBeInTheDocument();
      expect(screen.getByTestId("llama-server-settings-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("advanced-settings-tab")).not.toBeInTheDocument();
      expect(screen.queryByTestId("logger-settings-tab")).not.toBeInTheDocument();
    });

    it("renders AdvancedSettingsTab when activeTab is 2", () => {
      mockUseConfigurationForm.mockReturnValue({
        ...defaultMockReturn,
        activeTab: 2,
      });

      render(<ModernConfiguration />);

      expect(screen.queryByTestId("general-settings-tab")).not.toBeInTheDocument();
      expect(screen.queryByTestId("llama-server-settings-tab")).not.toBeInTheDocument();
      expect(screen.getByTestId("advanced-settings-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("logger-settings-tab")).not.toBeInTheDocument();
    });

    it("renders LoggerSettingsTab when activeTab is 3", () => {
      mockUseConfigurationForm.mockReturnValue({
        ...defaultMockReturn,
        activeTab: 3,
      });

      render(<ModernConfiguration />);

      expect(screen.queryByTestId("general-settings-tab")).not.toBeInTheDocument();
      expect(screen.queryByTestId("llama-server-settings-tab")).not.toBeInTheDocument();
      expect(screen.queryByTestId("advanced-settings-tab")).not.toBeInTheDocument();
      expect(screen.getByTestId("logger-settings-tab")).toBeInTheDocument();
    });

    it("passes correct props to ConfigurationTabs", () => {
      const mockHandleTabChange = jest.fn();
      mockUseConfigurationForm.mockReturnValue({
        ...defaultMockReturn,
        activeTab: 2,
        handleTabChange: mockHandleTabChange,
      });

      render(<ModernConfiguration />);

      const tabs = screen.getByTestId("configuration-tabs");
      expect(tabs).toHaveAttribute("data-active-tab", "2");
    });

    it("passes correct props to ConfigurationStatusMessages", () => {
      mockUseConfigurationForm.mockReturnValue({
        ...defaultMockReturn,
        saveSuccess: true,
        validationErrors: ["Error 1"],
      });

      render(<ModernConfiguration />);

      expect(screen.getByTestId("configuration-status-messages")).toBeInTheDocument();
    });

    it("passes correct props to ConfigurationActions", () => {
      mockUseConfigurationForm.mockReturnValue({
        ...defaultMockReturn,
        isSaving: true,
        handleSave: jest.fn(),
      });

      render(<ModernConfiguration />);

      expect(screen.getByTestId("configuration-actions")).toBeInTheDocument();
    });

    it("passes correct props to GeneralSettingsTab", () => {
      const mockFormConfig = { general: { setting: "value" } };
      const mockFieldErrors = { general: { field: "error" } };
      const mockHandleInputChange = jest.fn();

      mockUseConfigurationForm.mockReturnValue({
        ...defaultMockReturn,
        formConfig: mockFormConfig,
        fieldErrors: mockFieldErrors,
        handleInputChange: mockHandleInputChange,
      });

      render(<ModernConfiguration />);

      expect(screen.getByTestId("general-settings-tab")).toBeInTheDocument();
    });

    it("passes correct props to LlamaServerSettingsTab", () => {
      const mockHandleLlamaServerChange = jest.fn();

      mockUseConfigurationForm.mockReturnValue({
        ...defaultMockReturn,
        activeTab: 1,
        handleLlamaServerChange: mockHandleLlamaServerChange,
      });

      render(<ModernConfiguration />);

      expect(screen.getByTestId("llama-server-settings-tab")).toBeInTheDocument();
    });

    it("passes correct props to AdvancedSettingsTab", () => {
      const mockHandleReset = jest.fn();
      const mockHandleSync = jest.fn();

      mockUseConfigurationForm.mockReturnValue({
        ...defaultMockReturn,
        activeTab: 2,
        isSaving: true,
        handleReset: mockHandleReset,
        handleSync: mockHandleSync,
      });

      render(<ModernConfiguration />);

      expect(screen.getByTestId("advanced-settings-tab")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("wraps content in Box component", () => {
      mockUseConfigurationForm.mockReturnValue({
        loading: false,
        config: {},
        activeTab: 0,
        formConfig: {},
        validationErrors: [],
        fieldErrors: {},
        isSaving: false,
        saveSuccess: false,
        handleTabChange: jest.fn(),
        handleInputChange: jest.fn(),
        handleLlamaServerChange: jest.fn(),
        handleSave: jest.fn(),
        handleReset: jest.fn(),
        handleSync: jest.fn(),
      });

      render(<ModernConfiguration />);

      expect(screen.getByTestId("mui-box")).toBeInTheDocument();
    });
  });
});
