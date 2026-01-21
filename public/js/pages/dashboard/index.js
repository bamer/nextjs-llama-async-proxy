// Dashboard Page Components Index
// Auto-exports all components for easy importing

export { default as MetricsSection } from "./metrics-section.js";
export { default as RouterCardSection } from "./router-card-section.js";
export { default as HealthSection } from "./health-section.js";
export { default as GPUSection } from "./gpu-section.js";
export { default as DashboardPage } from "./page.js";
export { default as DashboardController } from "./dashboard-controller.js";

// Also make available on window for legacy code
if (typeof window !== "undefined") {
  window.MetricsSection = window.MetricsSection || require("./metrics-section.js").default;
  window.RouterCardSection = window.RouterCardSection || require("./router-card-section.js").default;
  window.HealthSection = window.HealthSection || require("./health-section.js").default;
  window.GPUSection = window.GPUSection || require("./gpu-section.js").default;
  window.DashboardPage = window.DashboardPage || require("./page.js").default;
  window.DashboardController = window.DashboardController || require("./dashboard-controller.js").default;
}