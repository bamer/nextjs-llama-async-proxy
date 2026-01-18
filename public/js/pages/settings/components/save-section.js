/**
 * Save Section Component
 * Consistent styling with dashboard cards
 */

class SaveSection extends Component {
  constructor(props) {
    super(props);
  }

  bindEvents() {
    // Save button click handler
    this.on("click", "[data-action=save]", (e) => {
      e.preventDefault();
      // The actual save is handled by settings-page.js via state subscription
    });
  }

  render() {
    return Component.h("div", { className: "settings-page" }, [
      // Save Configuration Card
      Component.h("div", { className: "save-section" }, [
        Component.h("h3", { className: "save-title" }, "Save Configuration"),
        Component.h("p", { className: "save-desc" }, "Settings apply on router restart"),
        Component.h(
          "div",
          { className: "save-actions" },
          Component.h(
            "button",
            { className: "btn btn-primary btn-lg", "data-action": "save" },
            "Save All Settings"
          )
        ),
      ]),

      // About Card
      Component.h("div", { className: "about-section" }, [
        Component.h("h3", { className: "about-title" }, "Llama Async Proxy Dashboard"),
        Component.h("p", { className: "about-version" }, "Version 1.2"),
      ]),
    ]);
  }
}

window.SaveSection = SaveSection;
