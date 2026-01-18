/**
 * Router Actions Handler - Socket-First Architecture
 * Handles start, stop, restart, and preset-based router operations
 * Part of the event-driven architecture (≤200 lines)
 *
 * Socket contracts:
 * - router:start           POST start router
 * - router:stop            POST stop router
 * - router:restart         POST restart router
 * - router:start-preset    POST start with preset
 * - router:status          [BROADCAST] Status changed
 *
 * This file is loaded as a global script - NOT an ES module
 */

// Local loading state (replaces stateManager.set/get)
let routerLoading = false;

/**
 * Handle router action events (start, stop, restart, start-with-preset)
 * Uses Socket.IO directly for backend communication
 *
 * @param {string} action - Action to perform: "start", "stop", "restart", "start-with-preset"
 * @param {string} [presetName] - Optional preset name for "start-with-preset" action
 * @returns {Promise<void>}
 *
 * @example
 * ```javascript
 * await window.handleRouterAction("start");
 * await window.handleRouterAction("start-with-preset", "codellama-7b");
 * await window.handleRouterAction("stop");
 * await window.handleRouterAction("restart");
 * ```
 */
window.handleRouterAction = async function (action, presetName) {
  console.log("[RouterActions] Handling action:", action, presetName);

  // Validate action
  const validActions = ["start", "stop", "restart", "start-with-preset"];
  if (!validActions.includes(action)) {
    console.warn("[RouterActions] Unknown action:", action);
    return;
  }

  // Set local loading state (replaces stateManager.set("routerLoading", true))
  routerLoading = true;

  try {
    let response;

    switch (action) {
      case "start":
        console.log("[DEBUG] Starting router");
        response = await socketClient.request("router:start", {});

        if (response.success) {
          console.log("[RouterActions] Router started successfully");
          showNotification("Router started successfully", "success");
          // Server broadcasts router:status
        } else {
          throw new Error(response.error || "Failed to start router");
        }
        break;

      case "start-with-preset":
        if (!presetName) {
          throw new Error("Preset name required for start-with-preset action");
        }

        console.log("[DEBUG] Starting router with preset:", presetName);
        response = await socketClient.request("router:start-preset", {
          presetName,
        });

        if (response.success) {
          console.log("[RouterActions] Router started with preset:", presetName);
          showNotification(`Router started with preset: ${presetName}`, "success");
          // Server broadcasts router:status
        } else {
          throw new Error(response.error || "Failed to start router");
        }
        break;

      case "stop":
        console.log("[DEBUG] Stopping router");
        response = await socketClient.request("router:stop", {});

        if (response.success) {
          console.log("[RouterActions] Router stopped");
          showNotification("Router stopped", "info");
          // Server broadcasts router:status
        } else {
          throw new Error(response.error || "Failed to stop router");
        }
        break;

      case "restart":
        console.log("[DEBUG] Restarting router");
        response = await socketClient.request("router:restart", {});

        if (response.success) {
          console.log("[RouterActions] Router restarted");
          showNotification("Router restarted successfully", "success");
          // Server broadcasts router:status
        } else {
          throw new Error(response.error || "Failed to restart router");
        }
        break;

      default:
        // Should not reach here due to validation above
        break;
    }
  } catch (error) {
    console.error("[RouterActions] Action failed:", action, error.message);
    showNotification(`Failed to ${action} router: ${error.message}`, "error");
    throw error;
  } finally {
    // Always clear local loading state (replaces stateManager.set("routerLoading", false))
    routerLoading = false;
  }
};

/**
 * Get current router loading state
 * @returns {boolean} Whether router operation is in progress
 */
window.isRouterLoading = function () {
  return routerLoading;
};
