/**
 * Router Card Component - Event-Driven DOM Updates
 */

class RouterCard extends Component {
  constructor(props) {
    super(props);
    this.status = props.status || null;
    this.routerStatus = props.routerStatus || null;
    this.models = props.models || [];
    this.configPort = props.configPort || 8080;
    this.onAction = props.onAction || (() => {});
    this.routerLoading = false;
    this.presets = props.presets || [];
    this.selectedPreset = null;
    this.maxModelsLoaded = props.maxModelsLoaded || 4;
    this.ctxSize = props.ctxSize || 4096;
  }

  bindEvents() {
    this.on("click", "[data-action=start]", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.routerLoading = true;
      this._updateUI();

      if (this.selectedPreset) {
        this.onAction("start-with-preset", this.selectedPreset);
      } else {
        this.onAction("start");
      }
    });

    this.on("click", "[data-action=stop]", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.routerLoading = true;
      this._updateUI();
      this.onAction("stop");
    });

    this.on("click", "[data-action=restart]", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.routerLoading = true;
      this._updateUI();
      this.onAction("restart");
    });

    this.on("change", "#preset-select", (e) => {
      this.selectedPreset = e.target.value;
      this._updateUI();
    });
  }

  onMount() {
    // Get initial status from stateManager - use llamaServerStatus for consistency
    const initialStatus = stateManager.get("llamaServerStatus");
    if (initialStatus) {
      this.status = initialStatus;
      this._updateUI();
    }

    // Also check routerStatus for backward compatibility
    const initialRouterStatus = stateManager.get("routerStatus");
    if (initialRouterStatus && !this.status) {
      this.status = initialRouterStatus;
      this._updateUI();
    }

    // Subscribe to presets changes (presets may load after initial render)
    const unsubPresets = stateManager.subscribe("presets", (presets) => {
      const hadPresets = this.presets && this.presets.length > 0;
      this.presets = presets || [];

      // Re-render to show/hide preset select if state changed
      if (this._el) {
        const presetSelector = this._el.querySelector(".preset-selector");

        if (this.presets.length > 0 && !presetSelector) {
          // Create the preset selector if it doesn't exist
          const controls = this._el.querySelector(".router-controls");
          if (controls) {
            presetSelector = document.createElement("div");
            presetSelector.className = "preset-selector";
            presetSelector.innerHTML = `<select id="preset-select" class="preset-dropdown"><option value="">Select Preset...</option>${this.presets.map((p) => `<option value="${p.name}">${p.name}</option>`).join("")}</select>`;
            controls.insertBefore(presetSelector, controls.firstChild);
          }
        } else if (this.presets.length > 0 && presetSelector) {
          // Update existing select
          const select = this._el.querySelector("#preset-select");
          if (select) {
            select.innerHTML = '<option value="">Select Preset...</option>' +
              this.presets.map((p) => `<option value="${p.name}">${p.name}</option>`).join("");
          }
        }
      }
    });
    this._unsubscribers = this._unsubscribers || [];
    this._unsubscribers.push(unsubPresets);

    if (this.props.subscribeToUpdates) {
      const unsub = this.props.subscribeToUpdates((status) => {
        this.status = status;
        this.routerLoading = false;
        this._updateUI();
      });
      this._unsubscribers.push(unsub);
    }

    // Subscribe to llamaServerStatus changes for consistency
    const unsubDirect = stateManager.subscribe("llamaServerStatus", (status) => {
      this.status = status;
      this.routerLoading = false;
      this._updateUI();
    });
    this._unsubscribers.push(unsubDirect);

    // Also subscribe to routerStatus for backward compatibility
    const unsubRouter = stateManager.subscribe("routerStatus", (status) => {
      // Only update if we don't have llamaServerStatus
      if (!stateManager.get("llamaServerStatus")) {
        this.status = status;
        this.routerLoading = false;
        this._updateUI();
      }
    });
    this._unsubscribers.push(unsubRouter);
  }

  destroy() {
    if (this._unsubscribers) {
      this._unsubscribers.forEach((unsub) => unsub && unsub());
      this._unsubscribers = [];
    }
    super.destroy && super.destroy();
  }

  _updateUI() {
    if (!this._el) return;

    // Check both llamaServerStatus (status field) and routerStatus (port field)
    const isRunning = this.status?.port || this.status?.status === "running";
    const routerLoading = this.routerLoading;
    const loadedCount = (this.routerStatus?.models || []).filter(
      (x) => x.state === "loaded"
    ).length;

    const statusBadge = this._el.querySelector(".status-badge");
    if (statusBadge) {
      if (routerLoading) {
        statusBadge.textContent = isRunning ? "STOPPING..." : "STARTING...";
        statusBadge.className = "status-badge loading";
      } else {
        statusBadge.textContent = isRunning ? "RUNNING" : "STOPPED";
        statusBadge.className = `status-badge ${isRunning ? "running" : "idle"}`;
      }
    }

    const routerInfo = this._el.querySelector(".router-info");
    if (routerInfo) {
      routerInfo.style.display = isRunning ? "flex" : "none";
    }

    const modelsText = this._el.querySelector(".router-info .models-info");
    if (modelsText && isRunning) {
      modelsText.textContent = `Models: ${loadedCount}/${this.models.length} loaded`;
    }

    const startStopBtn = this._el.querySelector('[data-action="start"], [data-action="stop"]');
    if (startStopBtn) {
      if (isRunning) {
        startStopBtn.setAttribute("data-action", "stop");
        startStopBtn.className = "btn btn-danger";
        startStopBtn.textContent = routerLoading ? "STOPPING..." : "STOP ROUTER";
      } else {
        startStopBtn.setAttribute("data-action", "start");
        startStopBtn.className = "btn btn-primary";
        startStopBtn.textContent = routerLoading ? "STARTING..." : "START ROUTER";
      }
      startStopBtn.disabled = routerLoading;
    }

    const restartBtn = this._el.querySelector('[data-action="restart"]');
    if (restartBtn) {
      restartBtn.disabled = !isRunning || routerLoading;
      restartBtn.textContent = routerLoading ? "RESTARTING..." : "RESTART";
    }
  }

  render() {
    // Check both llamaServerStatus (status field) and routerStatus (port field)
    const isRunning = this.status?.port || this.status?.status === "running";
    const displayPort = this.status?.port || this.configPort || 8080;
    const routerModels = this.routerStatus?.models || [];
    const loadedCount = routerModels.filter((x) => x.state === "loaded").length;

    return `<div class="router-section">
  <div class="router-card ${isRunning ? "running" : "idle"}">
    <div class="router-header">
      <div class="router-title">
        <h3>Llama Router</h3>
        <span class="status-badge ${isRunning ? "running" : "idle"}">${isRunning ? "RUNNING" : "STOPPED"}</span>
      </div>
      ${isRunning ? `<div class="router-info"><span class="info-item">Port: ${displayPort}</span><span class="info-item models-info">Models: ${loadedCount}/${this.models.length} loaded</span></div>` : ""}
    </div>
    <div class="router-controls">
      ${this.presets && this.presets.length > 0 ? `<div class="preset-selector"><select id="preset-select" class="preset-dropdown"><option value="">Select Preset...</option>${this.presets.map((preset) => `<option value="${preset.name}">${preset.name}</option>`).join("")}</select></div>` : ""}
      ${isRunning ? '<button class="btn btn-danger" data-action="stop">STOP ROUTER</button>' : '<button class="btn btn-primary" data-action="start">START ROUTER</button>'}
      <button class="btn btn-secondary" data-action="restart" ${!isRunning ? "disabled" : ""}>RESTART</button>
    </div>
  </div>
</div>`;
  }
}

window.RouterCard = RouterCard;
