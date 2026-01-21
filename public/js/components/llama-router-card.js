/**
 * LlamaRouterCard - Modern Unified Component
 * Pure Event-Driven DOM Updates
 * Socket-First Architecture: No stateManager dependency
 */
class LlamaRouterCard extends Component {
    constructor(props) {
        super(props);
        this.routerLoading = false;
        this.unsubscribers = [];
        this.selectedPreset = "";
        this.status = {};
        this.routerStatus = {};
        this.metrics = {};
        this.presets = [];
        this.config = {};
        console.log("[LlamaRouterCard] Constructor - presets:", {
            count: props?.presets?.length || 0,
            presets: props?.presets?.map(p => ({ name: p.name || p })) || [],
        });
    }

    onMount() {
        if (this._el) this._el._component = this;
        this._updateUI();
        this._updatePresetSelect();
        // Generate launch preview immediately from props.config (no socket request needed)
        this._updateLaunchPreviewFromConfig();

        // Subscribe to socket broadcasts instead of stateManager
        this.unsubscribers = [
            socketClient.on("llama:status", (data) => {
                this.status = data || {};
                this._updateUI();
            }),
            socketClient.on("router:status", (data) => {
                this.routerStatus = data || {};
                this._updateUI();
            }),
            socketClient.on("router:loading", (data) => {
                this.routerLoading = !!data?.loading;
                this._updateUI();
            }),
            socketClient.on("presets:updated", (data) => {
                // Update from broadcast - use props.presets
                this.presets = data?.presets || [];
                this.props.presets = this.presets;
                this._updatePresetSelect();
            }),
            socketClient.on("routerConfig:updated", () => {
                // Refresh launch preview when config changes
                this._requestLaunchPreview();
            }),
        ];

        // Request launch preview (works whether router is running or not)
        // But also try to generate from config immediately
        this._requestLaunchPreview();

        // Only set up scraper once (not on every mount/re-render)
        if (window.MetricsScraper && !this._scraper) {
            this._setupScraper();
        }
    }

    /**
     * Generate launch command preview locally from props.config
     * No socket request needed - shows immediately on page load
     */
    _updateLaunchPreviewFromConfig() {
        const config = this.props?.config || {};
        const commandTextarea = this.$("#launch-command-textarea");
        const errorDiv = this.$(".launch-command-error");

        // Build command from config
        const port = config.port || 8080;
        const host = config.host || "127.0.0.1";
        const threads = config.threads || 4;
        const ctxSize = config.ctxSize || 4096;
        const maxModels = config.maxModelsLoaded || 4;
        const modelsPath = config.modelsPath || "/path/to/models";
        const serverPath = config.serverPath || "llama-server";

        const command = `${serverPath} --port ${port} --host ${host} --threads ${threads} --ctx-size ${ctxSize} --models-max ${maxModels} --models-dir "${modelsPath}"`;

        if (commandTextarea) {
            commandTextarea.value = command;
        }
        if (errorDiv) {
            errorDiv.style.display = "none";
        }
    }

    /**
     * Request launch command preview from server
     * Works even when router is not running
     */
    async _requestLaunchPreview() {
        try {
            const response = await socketClient.request("llama:preview-command", {});
            const commandTextarea = this.$("#launch-command-textarea");
            const errorDiv = this.$(".launch-command-error");

            if (response.success && response.command) {
                if (commandTextarea) {
                    commandTextarea.value = response.command;
                }
                if (errorDiv) {
                    errorDiv.style.display = "none";
                }
            } else {
                if (commandTextarea) {
                    commandTextarea.value = "";
                }
                if (errorDiv) {
                    errorDiv.textContent = response.error || "Unable to generate preview";
                    errorDiv.style.display = "block";
                }
                console.error("[LlamaRouterCard] Launch preview failed:", response.error);
            }
        } catch (e) {
            console.error("[LlamaRouterCard] Launch preview error:", e);
        }
    }

    destroy() {
        if (this.unsubscribers) {
            this.unsubscribers.forEach(u => u());
            this.unsubscribers = [];
        }
        if (this._scraper) this._scraper.stop();
    }

    _setupScraper() {
        // Get URL from routerStatus (set by router:status events)
        const url = this.routerStatus?.url;

        // Only set up scraper if server is running (has URL)
        // This is expected to be null when llama-server is not running
        if (!url) {
            return; // Silent - no warning needed for expected state
        }

        // Use shorter interval (2s) for immediate feedback, but with smart dedup
        this._scraper = new window.MetricsScraper(url, 2000);
        this._scraper.start((metrics) => {
            // Update local state only when metrics actually change
            const currentMetrics = this.metrics || {};

            // Check if meaningful changes (> 0.1% change for token rates)
            let hasChange = false;
            for (const key in metrics) {
                const oldVal = currentMetrics[key] || 0;
                const newVal = metrics[key] || 0;

                if (key.includes("Seconds")) {
                    const threshold = Math.max(0.05, Math.abs(oldVal) * 0.001);
                    if (Math.abs(newVal - oldVal) > threshold) {
                        hasChange = true;
                        break;
                    }
                } else if (newVal !== oldVal) {
                    hasChange = true;
                    break;
                }
            }

            if (hasChange) {
                this.metrics = metrics;
                // Update BOTH detailed metrics AND glance grid (for real-time updates)
                this._updateDetailedMetrics();
                this._updateUI();
            }
        });
    }

    _updateUI() {
        if (!this._el) return;

        // Maintain component link
        if (this._el._component !== this) this._el._component = this;

        const status = this.status || {};
        const rs = this.routerStatus || {};
        const metrics = this.metrics || {};

        // Handle loading, running, and stopped states
        const isLoading = status.status === "loading";
        const isRunning = status.status === "running" || status.processRunning === true;
        const isStopped = status.status === "idle" || status.status === "error";
        const userLoading = this.routerLoading;

        // Status: LOADING → STARTING/STOPPING → RUNNING/STOPPED
        const displayLoading = isLoading || userLoading;
        const displayStatus = isLoading ? "LOADING..." : (userLoading ? (isRunning ? "STOPPING..." : "STARTING...") : (isRunning ? "RUNNING" : "STOPPED"));
        const displayClass = isLoading ? "loading" : (userLoading ? "loading" : (isRunning ? "running" : "stopped"));

        // 1. Status Indicator & Text
        const indicator = this.$(".status-indicator");
        if (indicator) {
            indicator.className = `status-indicator ${displayClass}`;
        }

        this.setText(".badge-text", displayStatus);

        // Header Port
        const displayPort = this.config?.port || rs?.port || status.port || 8080;
        const titleText = isRunning ? `Llama Router : ${displayPort}` : "Llama Router";
        this.setText(".header-title-text", titleText);

        // 2. Glance Grid - Show loading or data (12 metrics in 3 rows)
        if (isLoading) {
            // Row 1
            this.setText("[data-glance=\"prompt-ts\"]", "...");
            this.setText("[data-glance=\"pred-ts\"]", "...");
            this.setText("[data-glance=\"models\"]", "...");
            this.setText("[data-glance=\"uptime\"]", "...");
            // Row 2
            this.setText("[data-glance=\"n-ctx\"]", "...");
            this.setText("[data-glance=\"n-parallel\"]", "...");
            this.setText("[data-glance=\"n-threads\"]", "...");
            this.setText("[data-glance=\"total-slots\"]", "...");
            // Row 3
            this.setText("[data-glance=\"active-req\"]", "...");
            this.setText("[data-glance=\"queued-req\"]", "...");
            this.setText("[data-glance=\"kv-pct\"]", "...");
            this.setText("[data-glance=\"kv-tokens\"]", "...");
        } else {
            // Row 1: Throughput & Status
            const promptTs = metrics.promptTokensSeconds || 0;
            this.setText("[data-glance=\"prompt-ts\"]", `${promptTs.toFixed(1)} t/s`);
            const predTs = metrics.predictedTokensSeconds || 0;
            this.setText("[data-glance=\"pred-ts\"]", `${predTs.toFixed(1)} t/s`);

            // Models count
            const modelsData = status.models || rs.models || [];
            const loadedCount = Array.isArray(modelsData) ? modelsData.filter(m => m.status?.value === "loaded").length : 0;
            const totalModels = Array.isArray(modelsData) ? modelsData.length : (this.props.models || []).length || 0;
            this.setText("[data-glance=\"models\"]", `${loadedCount}/${totalModels}`);

            // Uptime
            let uptimeSeconds = metrics.uptime || status.uptime || 0;
            if (uptimeSeconds === 0 && status.startTime) {
                uptimeSeconds = Math.floor((Date.now() - status.startTime) / 1000);
            }
            this.setText("[data-glance=\"uptime\"]", window.FormatUtils.formatUptime(uptimeSeconds));

            // Row 2: Server Config (Ctx Size, Parallel, Threads, Slots)
            let nCtx = "N/A";
            let nParallel = "N/A";
            let nThreads = "N/A";
            const totalSlots = rs.totalSlots || status.totalSlots || "N/A";

            if (Array.isArray(modelsData)) {
                const loadedModel = modelsData.find(model => model.status?.value === "loaded");
                if (loadedModel?.args) {
                    const argsStr = loadedModel.args.join(" ");
                    const ctxMatch = argsStr.match(/--ctx-size\s+(\d+)/);
                    const threadsMatch = argsStr.match(/--threads\s+(\d+)/);
                    const parallelMatch = argsStr.match(/--ubatch-size\s+(\d+)/);
                    nCtx = ctxMatch ? ctxMatch[1] : "N/A";
                    nThreads = threadsMatch ? threadsMatch[1] : "N/A";
                    nParallel = parallelMatch ? parallelMatch[1] : "N/A";
                }
            }

            this.setText("[data-glance=\"n-ctx\"]", nCtx);
            this.setText("[data-glance=\"n-parallel\"]", nParallel);
            this.setText("[data-glance=\"n-threads\"]", nThreads);
            this.setText("[data-glance=\"total-slots\"]", String(totalSlots));

            // Row 3: Load & Resources (Active, Queued, KV %, KV Tokens)
            const active = metrics.requestsProcessing || 0;
            const queued = metrics.requestsDeferred || 0;
            const kvPct = metrics.kvCacheUsageRatio ? `${(metrics.kvCacheUsageRatio * 100).toFixed(0)}%` : "N/A";
            const kvTokens = metrics.kvCacheTokens ? window.FormatUtils.formatNumber(metrics.kvCacheTokens) : "N/A";

            this.setText("[data-glance=\"active-req\"]", String(active));
            this.setText("[data-glance=\"queued-req\"]", String(queued));
            this.setText("[data-glance=\"kv-pct\"]", kvPct);
            this.setText("[data-glance=\"kv-tokens\"]", kvTokens);
        }

        // 3. Toggle Button - disabled during loading
        const mainBtn = this.$("[data-action=\"toggle\"]");
        const restartBtn = this.$("[data-action=\"restart\"]");

        if (mainBtn) {
            mainBtn.disabled = displayLoading;
            if (isRunning && !userLoading) {
                mainBtn.textContent = "Stop Router";
                mainBtn.className = "btn btn-danger btn-stop";
                mainBtn.setAttribute("data-action-type", "stop");
            } else if (!displayLoading) {
                mainBtn.textContent = "Start Router";
                mainBtn.className = "btn btn-primary btn-start";
                mainBtn.setAttribute("data-action-type", "start");
            }
        }

        if (restartBtn) {
            restartBtn.disabled = !isRunning || displayLoading;
            restartBtn.textContent = displayLoading ? "Restarting..." : "Restart";
        }

        // 4. Update loaded models list display
        this._updateLoadedModelsList();
    }

    /**
     * Update the loaded models list display in the UI
     */
    _updateLoadedModelsList() {
        const status = this.status || {};
        const rs = this.routerStatus || {};
        const modelsData = status.models || rs.models || [];

        const loadedModelsContainer = this.$(".loaded-models-list");
        if (!loadedModelsContainer) return;

        // Filter for loaded models
        const loadedModels = modelsData.filter(m => m.status?.value === "loaded");

        // DOM-based rendering for loaded models
        // Clear and rebuild using DOM APIs to avoid innerHTML usage
        while (loadedModelsContainer.firstChild) loadedModelsContainer.removeChild(loadedModelsContainer.firstChild);
        if (loadedModels.length === 0) {
            const empty = document.createElement("div");
            empty.className = "no-models-loaded";
            empty.textContent = "No models loaded";
            loadedModelsContainer.appendChild(empty);
            return;
        }
        loadedModels.forEach((m) => {
            const modelName = m.id || m.name || "Unknown";
            const size = m.size ? this._formatModelSize(m.size) : "";
            const item = document.createElement("div");
            item.className = "loaded-model-item";
            item.setAttribute("data-model", modelName);
            const nameSpan = document.createElement("span");
            nameSpan.className = "model-name";
            nameSpan.textContent = modelName;
            item.appendChild(nameSpan);
            if (size) {
                const sizeSpan = document.createElement("span");
                sizeSpan.className = "model-size";
                sizeSpan.textContent = size;
                item.appendChild(sizeSpan);
            }
            loadedModelsContainer.appendChild(item);
        });
    }

    /**
     * Format model size for display
     */
    _formatModelSize(bytes) {
        if (!bytes) return "";
        const units = ["B", "KB", "MB", "GB", "TB"];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    _updateDetailedMetrics() {
        if (!this._el) return;
        const m = this.metrics || {};

        // Update launch command textarea if available
        const commandTextarea = this.$("#launch-command-textarea");
        if (commandTextarea && this.routerStatus?.launchCommand) {
            commandTextarea.value = this.routerStatus.launchCommand;
        }

        const status = this.status || {};
        const modelsData = status.models || [];

        // Get server config from loaded model's args
        let nCtx = "N/A";
        let nParallel = "N/A";
        let nThreads = "N/A";

        if (Array.isArray(modelsData)) {
            const loadedModel = modelsData.find(model => model.status?.value === "loaded");
            if (loadedModel?.args) {
                const argsStr = loadedModel.args.join(" ");
                const ctxMatch = argsStr.match(/--ctx-size\s+(\d+)/);
                const threadsMatch = argsStr.match(/--threads\s+(\d+)/);
                const parallelMatch = argsStr.match(/--ubatch-size\s+(\d+)/);

                nCtx = ctxMatch ? ctxMatch[1] : "N/A";
                nThreads = threadsMatch ? threadsMatch[1] : "N/A";
                nParallel = parallelMatch ? parallelMatch[1] : "N/A";
            }
        }

        // Update throughput metrics
        this.setText("[data-metric=\"prompt-ts\"]", `${(m.promptTokensSeconds || 0).toFixed(2)} t/s`);
        this.setText("[data-metric=\"pred-ts\"]", `${(m.predictedTokensSeconds || 0).toFixed(2)} t/s`);

        // Update server config metrics
        this.setText("[data-metric=\"n-ctx\"]", nCtx);
        this.setText("[data-metric=\"n-parallel\"]", nParallel);
        this.setText("[data-metric=\"n-threads\"]", nThreads);

        // Update uptime in glance grid
        let uptimeSeconds = m.uptime || status.uptime || 0;
        if (uptimeSeconds === 0 && status.startTime) {
            uptimeSeconds = Math.floor((Date.now() - status.startTime) / 1000);
        }
        this.setText("[data-glance=\"uptime\"]", window.FormatUtils.formatUptime(uptimeSeconds));
    }

    /**
     * Copy launch command to clipboard
     */
    _copyLaunchCommand() {
        const textarea = this.$("#launch-command-textarea");
        if (textarea && textarea.value) {
            navigator.clipboard.writeText(textarea.value).then(() => {
                showNotification("Launch command copied to clipboard!", "success");
            }).catch(() => {
                showNotification("Failed to copy command", "error");
            });
        }
    }

    _updatePresetSelect() {
        const select = this.$("#preset-select");
        if (!select) return;

        // Use props.presets which gets updated by the parent
        let presets = this.props.presets || [];

        // Ensure presets is an array
        if (!Array.isArray(presets)) {
            console.error("[LlamaRouterCard] presets is not an array:", {
                type: typeof presets,
                isArray: Array.isArray(presets),
                keys: Object.keys(presets || {})
            });
            presets = [];
        }

        const currentVal = this.selectedPreset;

        // Log for debugging
        console.log("[LlamaRouterCard] Updating preset select with:", {
            presetsCount: presets.length,
            presets: presets.map(p => ({ name: p.name || p })),
            selected: currentVal,
        });

        // Rebuild preset options without innerHTML
        while (select.firstChild) select.removeChild(select.firstChild);
        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = "Select Preset...";
        select.appendChild(defaultOpt);
        presets.forEach(p => {
            const name = p.name || p; // Handle both objects and strings
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            if (name === currentVal) opt.selected = true;
            select.appendChild(opt);
        });
    }

    bindEvents() {
        this.on("click", ".details-toggle-btn", () => {
            const area = this.$(".detailed-metrics-area");
            const isExpanded = area.classList.toggle("expanded");
            this.toggleClass(".details-toggle-btn", "expanded", isExpanded);
        });
        this.on("change", "#preset-select", (e) => { this.selectedPreset = e.target.value; });

        this.on("click", "[data-action=\"toggle\"]", (e, target) => {
            if (this.routerLoading) return;
            const type = target.getAttribute("data-action-type");

            if (type === "start") {
                if (this.selectedPreset) this.props.onAction("start-with-preset", this.selectedPreset);
                else this.props.onAction("start");
            } else {
                this.props.onAction("stop");
            }
        });

        this.on("click", "[data-action=\"restart\"]", () => {
            if (this.routerLoading) return;
            this.props.onAction("restart");
        });

        this.on("click", "[data-action=\"copy-launch-command\"]", () => {
            this._copyLaunchCommand();
        });
    }

    render() {
        return Component.h("div", { className: "llama-router-status-card" }, [
            Component.h("div", { className: "status-card-header" }, [
                Component.h("div", { className: "header-main" }, [
                    Component.h("h3", { className: "header-title" }, [
                        Component.h("i", { className: "ri-server-line" }),
                        Component.h("span", { className: "header-title-text" }, "Llama Router")
                    ]),
                    Component.h("div", { className: "status-badge-container" }, [
                        Component.h("span", { className: "status-indicator stopped" }),
                        Component.h("span", { className: "badge-text" }, "STOPPED")
                    ])
                ])
            ]),
            // Glance grid - 3 rows of 4 metrics (12 total)
            Component.h("div", { className: "status-glance-grid" }, [
                // Row 1: Throughput & Status
                this._renderGlanceItem("Prompt", "prompt-ts"),
                this._renderGlanceItem("Predicted", "pred-ts"),
                this._renderGlanceItem("Models", "models"),
                this._renderGlanceItem("Uptime", "uptime"),
                // Row 2: Server Config
                this._renderGlanceItem("Ctx Size", "n-ctx"),
                this._renderGlanceItem("Parallel", "n-parallel"),
                this._renderGlanceItem("Threads", "n-threads"),
                this._renderGlanceItem("Slots", "total-slots"),
                // Row 3: Load & Resources
                this._renderGlanceItem("Active", "active-req"),
                this._renderGlanceItem("Queued", "queued-req"),
                this._renderGlanceItem("KV %", "kv-pct"),
                this._renderGlanceItem("KV Tok", "kv-tokens"),
            ]),
            // Loaded Models Section - Shows currently loaded models
            Component.h("div", { className: "loaded-models-section" }, [
                Component.h("h4", { className: "loaded-models-title" }, "Loaded Models"),
                Component.h("div", { className: "loaded-models-list" }, [
                    Component.h("div", { className: "no-models-loaded" }, "No models loaded")
                ])
            ]),
            Component.h("div", { className: "status-controls-bar" }, [
                Component.h("div", { className: "preset-group" }, [
                    Component.h("select", { id: "preset-select", className: "preset-dropdown" }),
                    Component.h("button", {
                        className: "btn btn-primary btn-start",
                        "data-action": "toggle",
                        "data-action-type": "start"
                    }, "Start Router")
                ]),
                Component.h("div", { className: "action-group" }, [
                    Component.h("button", {
                        className: "btn btn-secondary",
                        "data-action": "restart",
                        disabled: true
                    }, "Restart")
                ])
            ]),
            Component.h("button", { className: "details-toggle-btn" }, [
                Component.h("span", { className: "chevron" }, "▼"), " Launch Command"
            ]),
            Component.h("div", { className: "detailed-metrics-area" }, [
                Component.h("div", { className: "launch-command-section" }, [
                    Component.h("h4", {}, "Router Launch Command"),
                    Component.h("p", { className: "launch-command-description" }, "Copy this command to test llama-server directly in terminal"),
                    Component.h("div", { className: "launch-command-container" }, [
                        Component.h("textarea", {
                            className: "launch-command-textarea",
                            id: "launch-command-textarea",
                            readonly: true,
                            rows: 4,
                        }, "Configure router settings and save to see preview command"),
                        Component.h("button", {
                            className: "btn btn-secondary btn-copy-command",
                            "data-action": "copy-launch-command"
                        }, "Copy")
                    ]),
                    Component.h("div", { className: "launch-command-error" }, "")
                ])
            ])
        ]);
    }

    _renderGlanceItem(label, key) {
        return Component.h("div", { className: "glance-item" }, [
            Component.h("span", { className: "glance-label" }, label),
            Component.h("span", { className: "glance-value", "data-glance": key }, "...")
        ]);
    }

    _renderMetricsGroup(title, metricsMap) {
        return Component.h("div", { className: "metrics-group" }, [
            Component.h("h4", {}, title),
            Component.h("div", { className: "metrics-subgrid" },
                Object.entries(metricsMap).map(([name, dataKey]) => Component.h("div", { className: "metric-row" }, [
                    Component.h("span", { className: "metric-name" }, name),
                    Component.h("span", { className: "metric-data", "data-metric": dataKey }, "...")
                ]))
            )
        ]);
    }
}

window.LlamaRouterCard = LlamaRouterCard;
