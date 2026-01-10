/**
 * Keyboard Shortcuts Manager
 * Handles global keyboard shortcuts
 */

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.enabled = true;
    console.log("[DEBUG] KeyboardShortcuts initialized");
  }

  /**
   * Register a keyboard shortcut
   * @param {string} key - Key combination (e.g., "Ctrl+L", "Escape")
   * @param {Function} handler - Callback function
   * @param {string} description - Shortcut description
   */
  register(key, handler, description) {
    this.shortcuts.set(key.toLowerCase(), { handler, description });
    console.log("[DEBUG] Registered shortcut:", key, description);
  }

  /**
   * Unregister a keyboard shortcut
   * @param {string} key - Key combination
   */
  unregister(key) {
    this.shortcuts.delete(key.toLowerCase());
    console.log("[DEBUG] Unregistered shortcut:", key);
  }

  /**
   * Enable keyboard shortcuts
   */
  enable() {
    this.enabled = true;
    console.log("[DEBUG] Keyboard shortcuts enabled");
  }

  /**
   * Disable keyboard shortcuts
   */
  disable() {
    this.enabled = false;
    console.log("[DEBUG] Keyboard shortcuts disabled");
  }

  /**
   * Parse keyboard event to get key combination
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {string} Key combination string
   */
  _parseKey(e) {
    const parts = [];

    if (e.ctrlKey || e.metaKey) {
      parts.push("ctrl");
    }
    if (e.altKey) {
      parts.push("alt");
    }
    if (e.shiftKey) {
      parts.push("shift");
    }

    const key = e.key.toLowerCase();
    if (key !== "control" && key !== "alt" && key !== "shift" && key !== "meta") {
      parts.push(key);
    }

    return parts.join("+");
  }

  /**
   * Get all registered shortcuts
   * @returns {Array} Array of shortcut objects
   */
  getAllShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([key, { description }]) => ({
      key,
      description,
    }));
  }

  /**
   * Initialize event listener
   */
  init() {
    console.log("[DEBUG] KeyboardShortcuts.init() - attaching listener");
    document.addEventListener("keydown", this._handleKeyDown.bind(this));
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} e - Keyboard event
   */
  _handleKeyDown(e) {
    if (!this.enabled) return;

    // Ignore if typing in input, textarea, or contenteditable
    const target = e.target;
    const isInput =
      target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

    const keyCombo = this._parseKey(e);
    const shortcut = this.shortcuts.get(keyCombo);

    if (shortcut && (!isInput || keyCombo === "escape")) {
      console.log("[DEBUG] Shortcut triggered:", keyCombo);
      e.preventDefault();
      e.stopPropagation();

      try {
        shortcut.handler(e);
      } catch (error) {
        console.error("[DEBUG] Shortcut handler error:", error);
      }
    }
  }
}

window.KeyboardShortcuts = KeyboardShortcuts;

// Initialize global shortcuts manager
window.keyboardShortcuts = new KeyboardShortcuts();
