/**
 * GPUSection - Atomic component for GPU display
 * Fully autonomous - manages its own socket subscriptions
 * No dependencies on parent DashboardPage
 */

class GPUSection extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      metrics: null,
      gpuMetrics: null,
      initialized: false,
    };
    this.unsubscribers = [];
  }

  onMount() {
    // Self-subscribe to metrics updates - no parent coordination needed
    this.unsubscribers.push(
      socketClient.on("metrics:updated", (data) => {
        this._onMetricsChange(data.metrics);
      })
    );

    // Load initial metrics
    this._loadInitialMetrics();
  }

  async _loadInitialMetrics() {
    try {
      const response = await socketClient.request("metrics:get", {});
      if (response.success && response.data) {
        this.state.metrics = response.data;
        this.state.gpuMetrics = response.data.gpu || null;
        this._updateUI();
        this._removeSkeleton();
      }
    } catch (error) {
      console.error("[GPUSection] Failed to load metrics:", error);
    }
  }

  _onMetricsChange(metrics) {
    if (metrics !== this.state.metrics) {
      this.state.metrics = metrics;
      this.state.gpuMetrics = metrics?.gpu || null;
      this._updateUI();
      this._removeSkeleton();
    }
  }

  _updateUI() {
    // GpuDetails manages its own updates via socket subscriptions
    // No manual update needed - component is fully autonomous
  }

  _removeSkeleton() {
    if (this.state.initialized) return;
    const section = this.$("[data-section='gpu']");
    if (section) {
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
      this.state.initialized = true;
    }
  }

  destroy() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    super.destroy();
  }

  render() {
    return Component.h(
      "div",
      {
        className: "gpu-section",
        "data-section": "gpu",
      },
      [
        Component.h(window.GpuDetails, {
          gpuList: this.state.gpuMetrics?.list || [],
        }),
      ]
    );
  }
}

window.GPUSection = GPUSection;