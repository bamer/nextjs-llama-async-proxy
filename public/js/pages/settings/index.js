/**
 * Settings Module Barrel Export
 * Exports all settings page classes and components
 */

// Load individual modules (attached to window by their modules)
import "./settings-controller.js";
import "./settings-page.js";
import "./components/llama-router-config.js";
import "./components/router-config.js";
import "./components/server-paths.js";
import "./components/model-defaults.js";
import "./components/logging-config.js";
import "./components/save-section.js";

// Re-export for convenience
window.SettingsController = window.SettingsController;
window.SettingsPage = window.SettingsPage;
window.LlamaRouterConfig = window.LlamaRouterConfig;
window.RouterConfig = window.RouterConfig;
window.ServerPathsForm = window.ServerPathsForm;
window.ModelDefaultsForm = window.ModelDefaultsForm;
window.LoggingConfig = window.LoggingConfig;
window.SaveSection = window.SaveSection;
