/**
 * Keyboard Shortcuts Help Modal
 * Shows available keyboard shortcuts
 */

class KeyboardShortcutsHelp extends Component {
  constructor(props) {
    super(props);
    this.shortcuts = props.shortcuts || [];
  }

  render() {
    return Component.h(
      "div",
      { className: "keyboard-shortcuts-modal", "data-modal": "keyboard-help" },
      Component.h(
        "div",
        { className: "modal-overlay" },
        Component.h(
          "div",
          { className: "modal-content" },
          Component.h(
            "div",
            { className: "modal-header" },
            Component.h("h2", {}, "Keyboard Shortcuts"),
            Component.h("button", { className: "btn-close", "data-action": "close" }, "×")
          ),
          Component.h(
            "div",
            { className: "modal-body" },
            Component.h(
              "table",
              { className: "shortcuts-table" },
              Component.h(
                "thead",
                {},
                Component.h(
                  "tr",
                  {},
                  Component.h("th", {}, "Shortcut"),
                  Component.h("th", {}, "Description")
                )
              ),
              Component.h(
                "tbody",
                {},
                ...this.shortcuts.map((s) =>
                  Component.h(
                    "tr",
                    {},
                    Component.h("td", { className: "shortcut-key" }, this._formatShortcut(s.key)),
                    Component.h("td", { className: "shortcut-desc" }, s.description)
                  )
                )
              )
            )
          )
        )
      )
    );
  }

  _formatShortcut(key) {
    // Format key for display (e.g., "ctrl+l" -> "Ctrl + L")
    return key
      .split("+")
      .map((k) => {
        if (k === "ctrl") return "Ctrl";
        if (k === "alt") return "Alt";
        if (k === "shift") return "Shift";
        return k.toUpperCase();
      })
      .join(" + ");
  }

  /**
   * Bind event handlers for the modal
   */
  bindEvents() {
    if (!this._el) return;

    // Close button click
    const closeBtn = this.$("[data-action=close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this._close();
      });
    }

    // Modal overlay click
    const overlay = this.$(".modal-overlay");
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          e.preventDefault();
          this._close();
        }
      });
    }

    // Escape key to close
    document.addEventListener("keydown", this._handleKeydown);
  }

  /**
   * Handle keyboard events
   */
  _handleKeydown = (e) => {
    if (e.key === "Escape" && this._el?.parentNode) {
      e.preventDefault();
      this._close();
    }
  };

  /**
   * Close the modal
   */
  _close() {
    if (this._el) {
      try {
        this._el.remove();
      } catch (e) {
        console.warn("[KeyboardShortcutsHelp] Error removing element:", e);
      }
      this._el = null;
    }
  }

  /**
   * Cleanup when component is destroyed
   */
  destroy() {
    // Remove keyboard listener
    document.removeEventListener("keydown", this._handleKeydown);
    super.destroy();
  }
}

window.KeyboardShortcutsHelp = KeyboardShortcutsHelp;
