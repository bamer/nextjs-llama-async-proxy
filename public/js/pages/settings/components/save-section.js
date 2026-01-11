/**
 * Save Section Component
 */

class SaveSection extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return Component.h(
      "div",
      {},
      Component.h(
        "div",
        { className: "settings-section" },
        Component.h(
          "div",
          { className: "card actions-card" },
          Component.h("h3", {}, "Save Configuration"),
          Component.h("p", { className: "info" }, "Settings apply on router restart"),
          Component.h(
            "div",
            { className: "action-buttons" },
            Component.h(
              "button",
              { className: "btn btn-primary", "data-action": "save" },
              "Save Settings"
            )
          )
        )
      ),
      Component.h(
        "div",
        { className: "settings-section" },
        Component.h(
          "div",
          { className: "card about-card" },
          Component.h("h3", {}, "Llama Async Proxy Dashboard"),
          Component.h("p", {}, "Version 1.2")
        )
      )
    );
  }
}

window.SaveSection = SaveSection;
