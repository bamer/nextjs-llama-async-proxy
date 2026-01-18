/**
 * Router Actions Handler - Event-Driven Router Control
 * Handles start, stop, restart, and preset-based router operations
 * Part of the event-driven architecture (≤200 lines)
 * 
 * This file is loaded as a global script - NOT an ES module
 */

/**
 * Handle router action events (start, stop, restart, start-with-preset)
 * Uses Socket.IO via stateManager for backend communication
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
window.handleRouterAction = async function(action, presetName) {
  console.log("[RouterActions] Handling action:", action, presetName);

  // Validate action
  const validActions = ["start", "stop", "restart", "start-with-preset"];
  if (!validActions.includes(action)) {
    console.warn("[RouterActions] Unknown action:", action);
    return;
  }

  // Set loading state
  stateManager.set("routerLoading", true);

  try {
    switch (action) {
      case "start":
        await stateManager.startLlama();
        console.log("[RouterActions] Router started successfully");
        showNotification("Router started successfully", "success");
        break;

      case "start-with-preset":
        if (!presetName) {
          throw new Error("Preset name required for start-with-preset action");
        }
        await stateManager.startLlamaWithPreset(presetName);
        console.log("[RouterActions] Router started with preset:", presetName);
        showNotification(`Router started with preset: ${presetName}`, "success");
        break;

      case "stop":
        await stateManager.stopLlama();
        console.log("[RouterActions] Router stopped");
        showNotification("Router stopped", "info");
        break;

      case "restart":
        await stateManager.restartLlama();
        console.log("[RouterActions] Router restarted");
        showNotification("Router restarted successfully", "success");
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
    // Always clear loading state
    stateManager.set("routerLoading", false);
  }
};
