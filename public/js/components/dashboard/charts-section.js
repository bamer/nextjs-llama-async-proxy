/**
 * ChartsSection Component - Completely Independent Socket-First
 * No props, no parent state - pure event-driven DOM updates
 */

class ChartsSection extends Component {
    constructor(props) {
        super(props);
        // NO PROPS - this component is autonomous
        // Data comes ONLY from socket broadcasts
        this.history = [];
        this.metrics = null;
        this.chartManager = null;
        this.chartsInitialized = false;
        this.unsubscribers = [];
        this.chartType = "usage";
    }

    render() {
        return Component.h("div", { className: "charts-section" }, [
            // Tab buttons
            Component.h("div", { className: "charts-tabs" }, [
                Component.h(
                    "button",
                    {
                        className: "tab-btn",
                        "data-tab": "usage",
                        "data-action": "switch-tab",
                    },
                    "CPU Usage"
                ),
                Component.h(
                    "button",
                    {
                        className: "tab-btn",
                        "data-tab": "gpu",
                        "data-action": "switch-tab",
                    },
                    "GPU Usage"
                ),
                Component.h(
                    "button",
                    {
                        className: "tab-btn",
                        "data-tab": "memory",
                        "data-action": "switch-tab",
                    },
                    "Memory"
                ),
            ]),
            // Charts container
            Component.h("div", { className: "charts-container" }, [
                Component.h("canvas", { id: "chart-cpu", className: "chart-canvas" }),
                Component.h("canvas", {
                    id: "chart-gpu",
                    className: "chart-canvas hidden",
                }),
                Component.h("canvas", {
                    id: "chart-memory",
                    className: "chart-canvas hidden",
                }),
            ]),
            // Stats grid
            Component.h("div", { className: "chart-stats" }, [
                Component.h("div", { className: "stat-card" }, [
                    Component.h("span", { className: "stat-label" }, "Current"),
                    Component.h("span", { className: "stat-value", "data-stat": "current" }, "—"),
                ]),
                Component.h("div", { className: "stat-card" }, [
                    Component.h("span", { className: "stat-label" }, "Average"),
                    Component.h("span", { className: "stat-value", "data-stat": "avg" }, "—"),
                ]),
                Component.h("div", { className: "stat-card" }, [
                    Component.h("span", { className: "stat-label" }, "Peak"),
                    Component.h("span", { className: "stat-value", "data-stat": "max" }, "—"),
                ]),
            ]),
        ]);
    }

    bindEvents() {
        // Tab switching
        this.on("click", "[data-action=switch-tab]", (e, btn) => {
            const tabType = btn.dataset.tab;
            this._switchTab(tabType);
        });
    }

    onMount() {
        console.log("[CHARTS-SECTION] onMount - loading data from socket");

        // Subscribe to socket broadcasts - THIS IS THE ONLY DATA SOURCE
        this.unsubscribers = [
            socketClient.on("metrics:history:updated", (data) => {
                console.log("[CHARTS-SECTION] Received metrics:history:updated");
                this.history = data.history || [];
                this._updateCharts();
            }),
            socketClient.on("metrics:updated", (data) => {
                console.log("[CHARTS-SECTION] Received metrics:updated");
                this.metrics = data.metrics || this.metrics;
                this._updateStats();
            }),
        ];

        // Request initial data - ONE TIME ONLY
        this._loadInitialData();
    }

    /**
     * Load initial history data on mount
     */
    async _loadInitialData() {
        try {
            // Get initial history
            const historyResponse = await socketClient.request(
                "metrics:history",
                { limit: 60 }
            );
            if (historyResponse.success) {
                this.history = historyResponse.data || [];
                console.log(
                    "[CHARTS-SECTION] Loaded initial history:",
                    this.history.length
                );
            }

            // Get current metrics
            const metricsResponse = await socketClient.request("metrics:get", {});
            if (metricsResponse.success) {
                this.metrics = metricsResponse.data || null;
                console.log("[CHARTS-SECTION] Loaded initial metrics");
            }

            // Initialize charts
            this._initCharts();
        } catch (error) {
            console.error("[CHARTS-SECTION] Failed to load initial data:", error);
        }
    }

    /**
     * Initialize charts for the first time
     */
    _initCharts() {
        if (this.chartsInitialized) {
            console.warn("[CHARTS-SECTION] Charts already initialized");
            return;
        }

        console.log("[CHARTS-SECTION] Initializing charts");

        try {
            this.chartManager = new ChartManager({
                canvasIds: {
                    cpu: "chart-cpu",
                    gpu: "chart-gpu",
                    memory: "chart-memory",
                },
            });

            if (this.history.length > 0) {
                this.chartManager.updateCharts(this.history, this.chartType);
            }

            this.chartsInitialized = true;
        } catch (error) {
            console.error("[CHARTS-SECTION] Failed to initialize charts:", error);
        }
    }

    /**
     * Update charts with new history data - called by socket broadcasts
     */
    _updateCharts() {
        if (!this.chartsInitialized || !this.chartManager) {
            console.log("[CHARTS-SECTION] Charts not ready, initializing");
            this._initCharts();
            return;
        }

        console.log(
            "[CHARTS-SECTION] Updating charts with",
            this.history.length,
            "records"
        );

        try {
            // Update only the visible chart, not all of them
            this.chartManager.updateCharts(this.history, this.chartType);
            this._updateStats();
        } catch (error) {
            console.error("[CHARTS-SECTION] Failed to update charts:", error);
        }
    }

    /**
     * Update stat values below charts
     */
    _updateStats() {
        if (!this.history || this.history.length === 0) {
            return;
        }

        // Get stats for current chart type
        const stats = this._calculateStats();

        this.setText('[data-stat="current"]', this._formatValue(stats.current));
        this.setText('[data-stat="avg"]', this._formatValue(stats.avg));
        this.setText('[data-stat="max"]', this._formatValue(stats.max));
    }

    /**
     * Calculate stats for current chart type from history
     */
    _calculateStats() {
        if (!this.history || this.history.length === 0) {
            return { current: 0, avg: 0, max: 0 };
        }

        let values = [];

        if (this.chartType === "usage") {
            // CPU usage from metrics
            values = this.history
                .map((h) => h.metrics?.cpu || 0)
                .filter((v) => v > 0);
        } else if (this.chartType === "gpu") {
            // GPU usage from first GPU
            values = this.history
                .map((h) => {
                    const gpus = h.gpuMetrics || [];
                    return gpus[0]?.utilization || 0;
                })
                .filter((v) => v > 0);
        } else if (this.chartType === "memory") {
            // Memory usage percentage
            values = this.history
                .map((h) => {
                    const mem = h.metrics?.memory || {};
                    const used = mem.used || 0;
                    const total = mem.total || 1;
                    return (used / total) * 100;
                })
                .filter((v) => v > 0);
        }

        if (values.length === 0) {
            return { current: 0, avg: 0, max: 0 };
        }

        return {
            current: values[values.length - 1] || 0,
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            max: Math.max(...values),
        };
    }

    /**
     * Switch between CPU/GPU/Memory charts
     */
    _switchTab(tabType) {
        console.log("[CHARTS-SECTION] Switching to chart type:", tabType);
        this.chartType = tabType;

        // Update active tab button
        this.$$(".tab-btn").forEach((btn) => {
            if (btn.dataset.tab === tabType) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Update visible chart
        if (this.chartManager) {
            this.chartManager.updateCharts(this.history, tabType);
        }

        // Update stats
        this._updateStats();
    }

    /**
     * Format stat value based on chart type
     */
    _formatValue(value) {
        if (value === 0 || !value) return "—";
        if (this.chartType === "usage" || this.chartType === "gpu") {
            return Math.round(value) + "%";
        }
        if (this.chartType === "memory") {
            return Math.round(value) + "%";
        }
        return value.toFixed(1);
    }

    destroy() {
        console.log("[CHARTS-SECTION] destroy called");
        // Unsubscribe from all socket broadcasts
        this.unsubscribers.forEach((unsub) => unsub());
        this.unsubscribers = [];

        // Cleanup chart manager
        if (this.chartManager) {
            this.chartManager.destroy?.();
            this.chartManager = null;
        }

        this.chartsInitialized = false;
    }
}

window.ChartsSection = ChartsSection;
