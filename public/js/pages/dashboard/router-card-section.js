/**
 * RouterCardSection - Atomic component for router card and quick actions
 * Fully autonomous - manages its own socket subscriptions
 * No dependencies on parent DashboardPage
 */

class RouterCardSection extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      llamaStatus: null,
      routerStatus: null,
      models: [],
      presets: [],
      metrics: null,
      initialized: false,
    };
    this.unsubscribers = [];
  }

  onMount() {
    // Self-subscribe to all needed updates - no parent coordination needed
    this.unsubscribers.push(
      socketClient.on("llama:status", (data) => {
        this._onLlamaStatusChange(data.status);
      }),
      socketClient.on("router:status", (data) => {
        this._onRouterStatusChange(data);
      }),
      socketClient.on("models:updated", (data) => {
        this._onModelsChange(data.models);
      }),
      socketClient.on("presets:updated", (data) => {
        this._onPresetsChange(data.presets);
      }),
      socketClient.on("metrics:updated", (data) => {
        this._onMetricsChange(data.metrics);
      })
    );

    // Load initial data
    this._loadInitialData();
  }

  async _loadInitialData() {
    try {
      const [statusRes, modelsRes, presetsRes, metricsRes] = await Promise.all([
        socketClient.request("llama:status", {}),
        socketClient.request("models:list", {}),
        socketClient.request("presets:list", {}),
        socketClient.request("metrics:get", {}),
      ]);

      if (statusRes.success) {
        this.state.llamaStatus = statusRes.data;
        this.state.routerStatus = statusRes.data;
      }
      if (modelsRes.success) {
        this.state.models = modelsRes.data || [];
      }
      if (presetsRes.success) {
        this.state.presets = presetsRes.data.presets || [];
      }
      if (metricsRes.success && metricsRes.data) {
        this.state.metrics = metricsRes.data;
      }

      this._updateUI();
      this._removeSkeleton();
    } catch (error) {
      console.error("[RouterCardSection] Failed to load initial data:", error);
    }
  }

  _onLlamaStatusChange(status) {
    this.state.llamaStatus = status;
    this._updateRouterCard();
  }

  _onRouterStatusChange(status) {
    this.state.routerStatus = status;
    this._updateRouterCard();
  }

  _onModelsChange(models) {
    this.state.models = models || [];
    this._updateRouterCard();
  }

  _onPresetsChange(presets) {
    this.state.presets = presets || [];
    this._updateRouterCard();
  }

  _onMetricsChange(metrics) {
    this.state.metrics = metrics;
    this._updateRouterCard();
  }

  _updateRouterCard() {
    const routerCard = this._el?.querySelector(".llama-router-status-card")?._component;
    if (routerCard) {
      routerCard.props.status = this.state.llamaStatus;
      routerCard.props.routerStatus = this.state.routerStatus;
      routerCard.props.models = this.state.models;
      routerCard.props.presets = this.state.presets;
      routerCard.props.metrics = this.state.metrics;
      if (typeof routerCard._updatePresetSelect === "function") {
        routerCard._updatePresetSelect();
      }
    }
  }

  _updateUI() {
    this._updateRouterCard();
  }

  _removeSkeleton() {
    if (this.state.initialized) return;
    const section = this.$("[data-section='router']");
    if (section) {
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
      this.state.initialized = true;
    }
  }

  async _handleRefresh() {
    const response = await socketClient.request("metrics:get", {});
    if (response.success) {
      this.state.metrics = response.data;
      this._updateUI();
    }
  }

  destroy() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    super.destroy();
  }

  bindEvents() {
    this.on("click", "[data-action=refresh]", (e) => {
      e.preventDefault();
      this._handleRefresh();
    });
  }

  render() {
    return Component.h(
      "div",
      {
        className: "dashboard-middle-row",
        "data-section": "router",
      },
      [
        Component.h(window.LlamaRouterCard, {
          status: this.state.llamaStatus,
          routerStatus: this.state.routerStatus,
          models: this.state.models,
          presets: this.state.presets,
          metrics: this.state.metrics,
          onAction: (action, data) => this._handleRouterAction(action, data),
        }),
      ]
    );
  }

  _handleRouterAction(action, data) {
    if (typeof window.handleRouterAction === "function") {
      window.handleRouterAction(action, data).catch((err) => {
        console.error("[RouterCardSection] Router action error:", err);
      });
    }
  }
}

window.RouterCardSection = RouterCardSection;
