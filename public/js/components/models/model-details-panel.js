/**
 * Model Details Panel Component
 * Displays detailed information about a model
 */

class ModelDetailsPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      model: props.model || {},
      onClose: props.onClose || (() => {}),
    };
  }

  render() {
    const model = this.state.model;

    return Component.h(
      "div",
      { className: "model-details-panel" },
      Component.h(
        "div",
        { className: "panel-header" },
        Component.h("h3", {}, model.name),
        Component.h(
          "button",
          {
            className: "btn btn-close",
            "data-action": "close",
          },
          "×"
        )
      ),
      Component.h(
        "div",
        { className: "panel-content" },
        Component.h(
          "div",
          { className: "detail-row" },
          Component.h("span", { className: "label" }, "Type:"),
          Component.h("span", { className: "value" }, model.type || "llama")
        ),
        Component.h(
          "div",
          { className: "detail-row" },
          Component.h("span", { className: "label" }, "Status:"),
          Component.h(
            "span",
            { className: `status-badge status-${model.status || "idle"}` },
            model.status || "idle"
          )
        ),
        Component.h(
          "div",
          { className: "detail-row" },
          Component.h("span", { className: "label" }, "Created:"),
          Component.h("span", { className: "value" }, model.createdAt || "N/A")
        ),
        Component.h(
          "div",
          { className: "detail-row" },
          Component.h("span", { className: "label" }, "Updated:"),
          Component.h("span", { className: "value" }, model.updatedAt || "N/A")
        ),
        model.parameters
          ? Component.h(
            "div",
            { className: "params-section" },
            Component.h("h4", {}, "Parameters"),
            Component.h(
              "pre",
              { className: "params-json" },
              JSON.stringify(model.parameters, null, 2)
            )
          )
          : null
      ),
      Component.h(
        "div",
        { className: "panel-actions" },
        Component.h("button", { className: "btn btn-primary" }, "Configure"),
        Component.h("button", { className: "btn btn-secondary" }, "View Logs")
      )
    );
  }

  getEventMap() {
    return {
      "click [data-action=\"close\"]": "handleClose",
    };
  }

  handleClose() {
    this.state.onClose();
  }
}

window.ModelDetailsPanel = ModelDetailsPanel;
