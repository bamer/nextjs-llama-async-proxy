/**
 * Dashboard Module Barrel Export
 * Exports all dashboard page classes
 */

// Load individual modules (attached to window by their modules)
import "./dashboard-controller.js";
import "./page.js";
import "./not-found.js";

// Re-export for convenience
window.DashboardController = window.DashboardController;
window.DashboardPage = window.DashboardPage;
window.NotFoundController = window.NotFoundController;
