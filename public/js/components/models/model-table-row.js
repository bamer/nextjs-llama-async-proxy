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
    this.unsubscribers = [];
    this.state = {
      loading: false,
      status: this.model?.status || "unloaded",
    };
  }

  /**
   * Subscribe to action status for this model's loading state
   */
  onMount() {
    this.unsubscribers.push(
      stateManager.subscribe("actions:models:load", (action) => {
        if (action.modelId === this.model.name) {
          this._setLoading(action.status === "loading");
        }
      }),
      stateManager.subscribe("actions:models:unload", (action) => {
        if (action.modelId === this.model.name) {
          this._setLoading(false);
        }
      })
    );
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  destroy() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach(unsub => unsub());
      this.unsubscribers = [];
    }
    super.destroy();
  }

  _setLoading(loading) {
    this.state.loading = loading;
    const loadBtn = this.$("[data-action=load]");
    const statusCell = this.$(".status-cell");

    if (loadBtn) {
      loadBtn.disabled = loading;
      loadBtn.textContent = loading ? "Loading..." : "Load";
    }

    if (statusCell && loading) {
      statusCell.textContent = "Loading...";
    } else if (statusCell && !loading) {
      statusCell.textContent = this.statusBadge(this.state.status);
    }
  }

  /**
   * Bind event handlers for user interactions
   */
  bindEvents() {
    // Favorite toggle
    this.on("click", "[data-action=favorite]", () => {
      this.onFavoriteToggle?.(this.model);
    });

    // Test button
    this.on("click", "[data-action=test]", () => {
      this.onTest?.(this.model);
    });

    // Load/Unload button
    this.on("click", "[data-action=load]", () => {
      if (!this.state.loading) {
        this.onAction?.(this.model);
      }
    });
  }

  /**
   * Renders a single model table row.
   * @returns {HTMLElement} The table row element.
   */
  render() {
    const m = this.model;
    console.log("[MODELS] Rendering row for:", m.name);

    const isFavorite = m.favorite === 1 || m.favorite === true;
    const displayStatus = this.state.loading ? "Loading..." : this.statusBadge(m.status);

    return Component.h(
      "tr",
      { "data-name": m.name },
      Component.h("td", { className: "name-cell" }, m.name),
      Component.h("td", { className: "status-cell" }, displayStatus),
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
