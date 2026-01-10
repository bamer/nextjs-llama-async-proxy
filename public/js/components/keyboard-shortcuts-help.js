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

  getEventMap() {
    return {
      "click [data-action=close]": (e) => {
        e.preventDefault();
        this._el?.remove();
      },
      "click .modal-overlay": (e) => {
        e.preventDefault();
        this._el?.remove();
      },
    };
  }
}

window.KeyboardShortcutsHelp = KeyboardShortcutsHelp;
