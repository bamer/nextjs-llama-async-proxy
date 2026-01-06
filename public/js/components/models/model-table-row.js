/**
 * Models Table Row Component
 * Displays a single model in the table
 */

class ModelTableRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      model: props.model,
      onSelect: props.onSelect || (() => {}),
      onStart: props.onStart || (() => {}),
      onStop: props.onStop || (() => {}),
      onDelete: props.onDelete || (() => {}),
    };
  }

  render() {
    const model = this.state.model;
    const statusClass = `status-${model.status || "idle"}`;

    return Component.h(
      "tr",
      {},
      Component.h(
        "td",
        { className: "model-name" },
        Component.h("span", { className: "model-name-text" }, model.name),
        model.template
          ? Component.h("span", { className: "model-template-badge" }, model.template)
          : null
      ),
      Component.h("td", { className: "model-type" }, model.type || "llama"),
      Component.h(
        "td",
        {},
        Component.h("span", { className: `status-badge ${statusClass}` }, model.status || "idle")
      ),
      Component.h(
        "td",
        { className: "model-actions" },
        Component.h(
          "button",
          {
            className: "btn btn-sm btn-icon",
            "data-action": "select",
            title: "View Details",
          },
          "👁️"
        ),
        model.status === "running"
          ? Component.h(
            "button",
            {
              className: "btn btn-sm btn-warning",
              "data-action": "stop",
              title: "Stop Model",
            },
            "Stop"
          )
          : Component.h(
            "button",
            {
              className: "btn btn-sm btn-success",
              "data-action": "start",
              title: "Start Model",
            },
            "Start"
          ),
        Component.h(
          "button",
          {
            className: "btn btn-sm btn-danger",
            "data-action": "delete",
            title: "Delete Model",
          },
          "🗑️"
        )
      )
    );
  }

  getEventMap() {
    return {
      "click [data-action=\"select\"]": "handleSelect",
      "click [data-action=\"start\"]": "handleStart",
      "click [data-action=\"stop\"]": "handleStop",
      "click [data-action=\"delete\"]": "handleDelete",
    };
  }

  handleSelect() {
    this.state.onSelect();
  }

  handleStart() {
    this.state.onStart();
  }

  handleStop() {
    this.state.onStop();
  }

  handleDelete() {
    this.state.onDelete();
  }
}

window.ModelTableRow = ModelTableRow;
