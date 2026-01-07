class DashboardPage extends Component {
  constructor(props) {
    super(props);

    const metrics = props.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      gpu: null,
      disk: { used: 0 },
      uptime: 0,
    };
    const gpuMetrics = metrics.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0 };
    const history = props.history || [];

    this.state = {
      models: props.models || [],
      metrics,
      gpuMetrics,
      status: props.status || null,
      routerStatus: props.routerStatus || null,
      configPort: (props.config || {}).port || 8080,
      history,
      loading: false,
      routerLoading: false,
      chartType: "usage",
      chartStats: window.DashboardUtils._calculateStats(history),
    };
  }

  didMount() {
    this.unsubscribers = [];
    this.routerCardUpdater = null;
    
    // Provide subscription callback to RouterCard
    if (this.routerCardComponent) {
      this.routerCardComponent.props.subscribeToUpdates = (callback) => {
        this.routerCardUpdater = callback;
      };
    }
    
    this.unsubscribers.push(
      stateManager.subscribe("llamaStatus", (status) => {
        // Update state directly without setState to preserve charts
        this.state.status = status;
        // Clear loading state if status changed
        if (this.state.routerLoading) {
          // Clear loading when port changes (started or stopped)
          this.state.routerLoading = false;
        }
        // Notify RouterCard of status update
        if (this.routerCardUpdater) {
          this.routerCardUpdater(status);
        }
        // Update RouterCard UI only (not full page re-render)
        this._updateRouterCardUI();
      })
    );
    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        // Update state directly without setState to preserve charts
        this.state.routerStatus = rs;
        // Update RouterCard UI only (not full page re-render)
        this._updateRouterCardUI();
      })
    );
  }

  willDestroy() {
    this.unsubscribers?.forEach((unsub) => unsub());
  }

  _updateRouterCardUI() {
    if (!this._el) return;

    const routerCard = this._el.querySelector(".router-card");
    if (!routerCard) return;

    const status = this.state.status;
    const routerLoading = this.state.routerLoading;
    const isRunning = status?.port;

    // Update status badge
    const statusBadge = routerCard.querySelector(".status-badge");
    if (statusBadge) {
      if (routerLoading) {
        statusBadge.textContent = isRunning ? "STOPPING..." : "STARTING...";
        statusBadge.className = "status-badge loading";
      } else {
        statusBadge.textContent = isRunning ? "RUNNING" : "STOPPED";
        statusBadge.className = `status-badge ${isRunning ? "running" : "idle"}`;
      }
    }

    // Update router info visibility
    const routerInfo = routerCard.querySelector(".router-info");
    if (routerInfo) {
      routerInfo.style.display = isRunning ? "flex" : "none";
    }

    // Update button
    const controls = routerCard.querySelector(".router-controls");
    if (controls) {
      const btn = controls.querySelector("[data-action=\"start\"], [data-action=\"stop\"]");
      if (btn) {
        if (isRunning) {
          // Switch to Stop button
          btn.setAttribute("data-action", "stop");
          btn.className = "btn btn-danger";
          btn.textContent = routerLoading ? "⏹ Stopping..." : "⏹ Stop Router";
        } else {
          // Switch to Start button
          btn.setAttribute("data-action", "start");
          btn.className = "btn btn-primary";
          btn.textContent = routerLoading ? "▶ Starting..." : "▶ Start Router";
        }
        btn.disabled = routerLoading;
      }

      // Update restart button
      const restartBtn = controls.querySelector("[data-action=\"restart\"]");
      if (restartBtn) {
        restartBtn.disabled = !isRunning || routerLoading;
      }
    }
  }

  updateFromController(metrics, history) {
    const gpuMetrics = metrics?.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0 };
    const stats = window.DashboardUtils._calculateStatsForType(history, this.state.chartType);

    // Update chart manager with new data (without re-rendering)
    if (this.props.chartManager) {
      this.props.chartManager.updateCharts(metrics, history);
    }

    // Update DOM directly instead of setState to avoid full re-render
    if (this._el) {
      // Update chart stats in DOM
      const statsEl = this._el.querySelector(".chart-stats");
      if (statsEl) {
        const statValues = statsEl.querySelectorAll(".chart-stat-value");
        if (statValues.length >= 3) {
          statValues[0].textContent = `${stats.current.toFixed(1)}%`;
          statValues[1].textContent = `${stats.avg.toFixed(1)}%`;
          statValues[2].textContent = `${stats.max.toFixed(1)}%`;
        }
      }

      // Update ChartsSection DOM directly
      const chartsSection = this._el.querySelector(".charts-section");
      if (chartsSection) {
        const usageCanvas = chartsSection.querySelector("#usageChart");
        const memoryCanvas = chartsSection.querySelector("#memoryChart");
        if (usageCanvas && memoryCanvas) {
          usageCanvas.style.display = this.state.chartType === "usage" ? "block" : "none";
          memoryCanvas.style.display = this.state.chartType === "memory" ? "block" : "none";
        }

        const usageTab = chartsSection.querySelector("[data-chart=\"usage\"]");
        const memoryTab = chartsSection.querySelector("[data-chart=\"memory\"]");
        if (usageTab && memoryTab) {
          usageTab.classList.toggle("active", this.state.chartType === "usage");
          memoryTab.classList.toggle("active", this.state.chartType === "memory");
        }
      }
    }

    // Only update state that affects other parts
    this.state.metrics = metrics;
    this.state.gpuMetrics = gpuMetrics;
    this.state.history = history;
    this.state.chartStats = stats;
  }

  _updateChartStatsDOM(stats) {
    const statsEl = this._el?.querySelector(".chart-stats");
    if (!statsEl) return;

    const statValues = statsEl.querySelectorAll(".chart-stat-value");
    if (statValues.length >= 3) {
      statValues[0].textContent = `${stats.current.toFixed(1)}%`;
      statValues[1].textContent = `${stats.avg.toFixed(1)}%`;
      statValues[2].textContent = `${stats.max.toFixed(1)}%`;
    }
  }

  getEventMap() {
    return {
      "click [data-action=refresh]": "handleRefresh",
    };
  }

  handleChartTypeChange(newType) {
    if (newType === this.state.chartType) return;

    // Update chart manager state
    if (this.props.chartManager) {
      this.props.chartManager.setChartType(newType);
    }

    // Update local state variable (without setState to avoid re-render)
    this.state.chartType = newType;

    // Update DOM directly to avoid full re-render
    if (this._el) {
      // Update tab active states
      const usageTab = this._el.querySelector("[data-chart=\"usage\"]");
      const memoryTab = this._el.querySelector("[data-chart=\"memory\"]");
      if (usageTab && memoryTab) {
        usageTab.classList.toggle("active", newType === "usage");
        memoryTab.classList.toggle("active", newType === "memory");
      }

      // Update canvas visibility
      const usageCanvas = this._el.querySelector("#usageChart");
      const memoryCanvas = this._el.querySelector("#memoryChart");
      if (usageCanvas && memoryCanvas) {
        usageCanvas.style.display = newType === "usage" ? "block" : "none";
        memoryCanvas.style.display = newType === "memory" ? "block" : "none";
      }

      // Update chart stats based on new type
      const history = this.state.history;
      const stats = window.DashboardUtils._calculateStatsForType(history, newType);
      this.state.chartStats = stats;

      const statsEl = this._el.querySelector(".chart-stats");
      if (statsEl) {
        const statValues = statsEl.querySelectorAll(".chart-stat-value");
        if (statValues.length >= 3) {
          statValues[0].textContent = `${stats.current.toFixed(1)}%`;
          statValues[1].textContent = `${stats.avg.toFixed(1)}%`;
          statValues[2].textContent = `${stats.max.toFixed(1)}%`;
        }
      }
    }
  }

  handleRefresh(event) {
    event.preventDefault();
    this._refresh();
  }

  async _refresh() {
    this.setState({ loading: true });
    try {
      await this.props.controller?.load();
      showNotification("Dashboard refreshed", "success");
    } catch (e) {
      showNotification("Refresh failed", "error");
    }
    this.setState({ loading: false });
  }

  render() {
    return Component.h(
      "div",
      { className: "dashboard-page unified" },
      Component.h(window.RouterCard, {
        status: this.state.status,
        routerStatus: this.state.routerStatus,
        models: this.state.models,
        configPort: this.state.configPort,
        onAction: (action) => this.props.controller?.handleRouterAction(action),
      }),
      Component.h(window.StatsGrid, {
        metrics: this.state.metrics,
        gpuMetrics: this.state.gpuMetrics,
      }),
      Component.h(
        "div",
        { className: "content-row" },
        Component.h(window.ChartsSection, {
          history: this.state.history,
          chartStats: this.state.chartStats,
          chartManager: this.props.chartManager,
          onChartTypeChange: (type) => this.handleChartTypeChange(type),
        }),
        Component.h(window.SystemHealth, {
          metrics: this.state.metrics,
          gpuMetrics: this.state.gpuMetrics,
        })
      ),
      Component.h(window.QuickActions, {
        onRefresh: () => this._refresh(),
      })
    );
  }
}

window.DashboardPage = DashboardPage;
