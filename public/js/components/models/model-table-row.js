/**
 * Model Table Row Component
 * Individual model row with favorite star and test button
 */

class ModelTableRow extends Component {
  constructor(props) {
    super(props);
    this.model = props.model;
    this.onAction = props.onAction;
    this.onFavoriteToggle = props.onFavoriteToggle;
    this.onTest = props.onTest;
    this.statusBadge = props.statusBadge;
    this.actionBtn = props.actionBtn;
    this.fmtCtx = props.fmtCtx;
    this.fmtBytes = props.fmtBytes;
  }

  /**
   * Renders a single model table row.
   * @returns {HTMLElement} The table row element.
   */
  render() {
    const m = this.model;
    console.log("[MODELS] Rendering row for:", m.name);

    const isFavorite = m.favorite === 1 || m.favorite === true;

    return Component.h(
      "tr",
      { "data-name": m.name },
      Component.h("td", { className: "name-cell" }, m.name),
      Component.h("td", { className: "status-cell" }, this.statusBadge(m.status)),
      Component.h("td", {}, m.type || "-"),
      Component.h("td", {}, m.params || "-"),
      Component.h("td", {}, m.quantization || "-"),
      Component.h("td", {}, this.fmtCtx(m.ctx_size)),
      Component.h("td", {}, m.embedding_size || "-"),
      Component.h("td", {}, m.block_count || "-"),
      Component.h("td", {}, m.head_count || "-"),
      Component.h("td", { className: "size-cell" }, m.file_size ? this.fmtBytes(m.file_size) : "-"),
      Component.h(
        "td",
        { className: "action-cell" },
        Component.h(
          "button",
          {
            className: "btn btn-sm btn-favorite",
            "data-action": "favorite",
            title: isFavorite ? "Remove from favorites" : "Add to favorites",
          },
          isFavorite ? "★" : "☆"
        ),
        Component.h(
          "button",
          {
            className: "btn btn-sm btn-test",
            "data-action": "test",
            title: "Test model with simple completion",
          },
          "Test"
        ),
        this.actionBtn(m)
      )
    );
  }
}

window.ModelTableRow = ModelTableRow;
