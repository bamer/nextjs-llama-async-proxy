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
   * Called after component is mounted to DOM.
   * Listen to socket broadcasts for model status updates.
   */
  onMount() {
    // Subscribe to socket broadcasts for model status changes
    this.unsubscribers.push(
      socketClient.on("models:updated", this._onModelsUpdated.bind(this)),
      socketClient.on("model:status", this._onModelStatusChange.bind(this))
    );
  }

  /**
   * Handle models:updated broadcast - check if this model is affected
   */
  _onModelsUpdated(data) {
    const models = data?.models || [];
    const updatedModel = models.find(m => m.name === this.model.name);
    if (updatedModel && updatedModel.status !== this.model.status) {
      console.log("[ModelTableRow] Model status updated via broadcast:", this.model.name, updatedModel.status);
      this.model = { ...this.model, ...updatedModel };
      this.state.status = updatedModel.status;
      this._updateStatusUI();
    }
  }

  /**
   * Handle model:status broadcast - for targeted status updates
   */
  _onModelStatusChange(data) {
    if (data?.modelName === this.model.name) {
      console.log("[ModelTableRow] Model status changed:", this.model.name, data.status);
      this.state.status = data.status;
      this._setLoading(data.loading || false);
      this._updateStatusUI();
    }
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

  /**
   * Update just the status cell without full re-render
   */
  _updateStatusUI() {
    const statusCell = this.$(".status-cell");
    if (statusCell) {
      statusCell.textContent = this.statusBadge(this.state.status);
    }
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
   * Update the model data for this row
   * @param {Object} model - Updated model data
   */
  updateModel(model) {
    if (model && model.name === this.model.name) {
      this.model = { ...this.model, ...model };
      this.state.status = model.status || this.state.status;
      this._updateStatusUI();
    }
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
