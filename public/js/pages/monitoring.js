/**
 * Monitoring Page Controller
 */

class MonitoringController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubscribers = [];
    this.component = null;
  }

  init() {
    this.unsubscribers.push(
      stateManager.subscribe('metrics', this.onMetricsChange.bind(this)),
      stateManager.subscribe('metricsHistory', this.onMetricsHistoryChange.bind(this))
    );

    this.loadData();
  }

  async loadData() {
    try {
      const metricsData = await stateManager.getMetrics();
      stateManager.set('metrics', metricsData.metrics || null);

      const historyData = await stateManager.getMetricsHistory({ limit: 100 });
      stateManager.set('metricsHistory', historyData.history || []);
    } catch (error) {
      console.error('[Monitoring] Failed to load data:', error);
    }
  }

  onMetricsChange(metrics) {
    if (this.component) {
      this.component.updateMetrics(metrics);
    }
  }

  onMetricsHistoryChange(history) {
    if (this.component) {
      this.component.updateChart(history);
    }
  }

  willUnmount() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    if (this.component) {
      this.component.destroy();
    }
  }

  destroy() {
    this.willUnmount();
  }

  render() {
    this.component = new MonitoringPage({
      metrics: stateManager.get('metrics') || null,
      history: stateManager.get('metricsHistory') || []
    });

    this.init();

    return this.component.render();
  }

  didMount() {
    if (this.component && this.component.didMount) {
      this.component.didMount();
    }
  }
}

/**
 * Monitoring Page Component
 */
class MonitoringPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      metrics: props.metrics || null,
      history: props.history || [],
      activeTab: 'overview'
    };
  }

  render() {
    return Component.h('div', { className: 'monitoring-page' },
      Component.h('div', { className: 'monitoring-toolbar' },
        Component.h('div', { className: 'monitoring-actions' },
          Component.h('select', { className: 'time-range-select' },
            Component.h('option', { value: '1h' }, 'Last Hour'),
            Component.h('option', { value: '6h' }, 'Last 6 Hours'),
            Component.h('option', { value: '24h' }, 'Last 24 Hours'),
            Component.h('option', { value: '7d' }, 'Last 7 Days')
          ),
          Component.h('button', {
            className: 'btn btn-secondary',
            'data-action': 'refresh'
          }, 'Refresh')
        )
      ),
      Component.h('div', { className: 'monitoring-tabs' },
        Component.h('button', {
          className: `tab-button ${this.state.activeTab === 'overview' ? 'active' : ''}`,
          'data-tab': 'overview'
        }, 'Overview'),
        Component.h('button', {
          className: `tab-button ${this.state.activeTab === 'cpu' ? 'active' : ''}`,
          'data-tab': 'cpu'
        }, 'CPU'),
        Component.h('button', {
          className: `tab-button ${this.state.activeTab === 'memory' ? 'active' : ''}`,
          'data-tab': 'memory'
        }, 'Memory'),
        Component.h('button', {
          className: `tab-button ${this.state.activeTab === 'gpu' ? 'active' : ''}`,
          'data-tab': 'gpu'
        }, 'GPU')
      ),
      Component.h('div', { className: 'monitoring-content' },
        Component.h(MetricCards, { metrics: this.state.metrics }),
        Component.h(PerformanceChart, {
          data: this.state.history,
          metric: this.state.activeTab
        }),
        Component.h(SystemHealthSummary, { metrics: this.state.metrics })
      )
    );
  }

  updateMetrics(metrics) {
    this.setState({ metrics });
  }

  updateChart(history) {
    this.setState({ history });
  }

  getEventMap() {
    return {
      'click [data-tab]': 'handleTabChange',
      'click [data-action="refresh"]': 'handleRefresh'
    };
  }

  handleTabChange(event) {
    const tab = event.target.dataset.tab;
    this.setState({ activeTab: tab });
  }

  handleRefresh() {
    stateManager.getMetrics();
    stateManager.getMetricsHistory({ limit: 100 });
  }
}

/**
 * Metric Cards Component
 */
class MetricCards extends Component {
  constructor(props) {
    super(props);
    this.state = { metrics: props.metrics };
  }

  render() {
    const metrics = this.state.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      disk: { used: 0 },
      network: { rx: 0, tx: 0 },
      uptime: 0
    };

    const cards = [
      {
        title: 'CPU Usage',
        value: `${(metrics.cpu?.usage || 0).toFixed(1)}%`,
        icon: '💻',
        color: metrics.cpu?.usage > 80 ? 'danger' : metrics.cpu?.usage > 60 ? 'warning' : 'success'
      },
      {
        title: 'Memory Used',
        value: window.AppUtils.formatBytes(metrics.memory?.used || 0),
        icon: '🧠',
        color: 'info'
      },
      {
        title: 'Disk Usage',
        value: `${(metrics.disk?.used || 0).toFixed(1)}%`,
        icon: '💾',
        color: metrics.disk?.used > 80 ? 'danger' : 'info'
      },
      {
        title: 'Network',
        value: `${window.AppUtils.formatBytes(metrics.network?.rx || 0)} / ${window.AppUtils.formatBytes(metrics.network?.tx || 0)}`,
        icon: '🌐',
        color: 'info'
      },
      {
        title: 'Uptime',
        value: this.formatUptime(metrics.uptime || 0),
        icon: '⏱️',
        color: 'success'
      }
    ];

    if (metrics.gpu) {
      cards.push({
        title: 'GPU Memory',
        value: window.AppUtils.formatBytes(metrics.gpu.memoryUsed || 0),
        icon: '🎮',
        color: metrics.gpu.usage > 80 ? 'danger' : 'info'
      });
      cards.push({
        title: 'GPU Usage',
        value: `${(metrics.gpu.usage || 0).toFixed(1)}%`,
        icon: '🎯',
        color: metrics.gpu.usage > 80 ? 'danger' : 'info'
      });
      cards.push({
        title: 'GPU Temp',
        value: `${metrics.gpu.temperature || 0}°C`,
        icon: '🌡️',
        color: metrics.gpu.temperature > 80 ? 'danger' : metrics.gpu.temperature > 60 ? 'warning' : 'success'
      });
    }

    return Component.h('div', { className: 'metric-cards' },
      cards.map(card => Component.h(MonitoringMetricCard, {
        key: card.title,
        title: card.title,
        value: card.value,
        icon: card.icon,
        color: card.color
      }))
    );
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Monitoring Metric Card Component
 */
class MonitoringMetricCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: props.title,
      value: props.value,
      icon: props.icon,
      color: props.color || 'info'
    };
  }

  render() {
    return Component.h('div', { className: `monitoring-metric-card card color-${this.state.color}` },
      Component.h('div', { className: 'metric-icon' }, this.state.icon),
      Component.h('div', { className: 'metric-content' },
        Component.h('span', { className: 'metric-title' }, this.state.title),
        Component.h('span', { className: 'metric-value' }, this.state.value)
      )
    );
  }
}

/**
 * Performance Chart Component
 */
class PerformanceChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data || [],
      metric: props.metric || 'cpu'
    };
  }

  render() {
    return Component.h('div', { className: 'performance-chart card' },
      Component.h('div', { className: 'card-header' },
        Component.h('h3', {}, `Performance - ${this.state.metric.toUpperCase()}`)
      ),
      Component.h('div', { className: 'card-content' },
        Component.h('div', { className: 'chart-container' },
          this.state.data.length > 0 ? Component.h('div', { className: 'chart-svg' },
            this.renderChart()
          ) : Component.h('div', { className: 'chart-empty' },
            Component.h('p', {}, 'No data available')
          )
        )
      )
    );
  }

  renderChart() {
    const data = this.state.data;
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => this.getValue(d))) || 100;
    const width = 800;
    const height = 200;
    const padding = 20;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const value = this.getValue(d);
      const y = height - padding - (value / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return Component.h('svg', {
      viewBox: `0 0 ${width} ${height}`,
      className: 'line-chart'
    },
      Component.h('polyline', {
        fill: 'none',
        stroke: '#3b82f6',
        'stroke-width': '2',
        points
      }),
      data.slice(-1).map(d => {
        const value = this.getValue(d);
        const x = width - padding;
        const y = height - padding - (value / maxValue) * (height - padding * 2);
        return Component.h('circle', {
          cx: x,
          cy: y,
          r: '4',
          fill: '#3b82f6'
        });
      })
    );
  }

  getValue(d) {
    switch (this.state.metric) {
      case 'cpu': return d.cpu?.usage || 0;
      case 'memory': return d.memory?.used || 0;
      case 'disk': return d.disk?.used || 0;
      default: return d.cpu?.usage || 0;
    }
  }
}

/**
 * System Health Summary Component
 */
class SystemHealthSummary extends Component {
  constructor(props) {
    super(props);
    this.state = { metrics: props.metrics };
  }

  render() {
    const metrics = this.state.metrics;
    const isHealthy = this.checkHealth(metrics);

    return Component.h('div', { className: 'system-health-summary card' },
      Component.h('div', { className: 'card-header' },
        Component.h('h3', {}, 'System Health')
      ),
      Component.h('div', { className: 'card-content' },
        Component.h('div', {
          className: `health-indicator ${isHealthy ? 'healthy' : 'warning'}`
        },
          Component.h('span', { className: 'health-icon' }, isHealthy ? '✓' : '⚠'),
          Component.h('span', { className: 'health-text' },
            isHealthy ? 'All systems operational' : 'Some systems need attention'
          )
        ),
        Component.h('div', { className: 'health-checks' },
          this.renderHealthCheck('CPU Usage', metrics?.cpu?.usage, 80),
          this.renderHealthCheck('Memory Usage', metrics?.memory?.used, 85),
          this.renderHealthCheck('Disk Usage', metrics?.disk?.used, 90),
          metrics?.gpu ? this.renderHealthCheck('GPU Temperature', metrics.gpu.temperature, 80, true) : null
        )
      )
    );
  }

  renderHealthCheck(name, value, threshold, isTemp = false) {
    if (value === undefined || value === null) {
      value = 0;
    }
    const percentage = isTemp ? value : value;
    const status = percentage > threshold ? 'warning' : 'good';

    return Component.h('div', { className: `health-check ${status}` },
      Component.h('span', { className: 'check-name' }, name),
      Component.h('span', { className: 'check-value' },
        isTemp ? `${value}°C` : `${Number(value).toFixed(1)}%`
      ),
      Component.h('span', { className: 'check-status' }, status === 'good' ? '✓' : '⚠')
    );
  }

  checkHealth(metrics) {
    if (!metrics) return true;
    if ((metrics.cpu?.usage || 0) > 80) return false;
    if ((metrics.memory?.used || 0) > 85) return false;
    if ((metrics.disk?.used || 0) > 90) return false;
    if ((metrics.gpu?.temperature || 0) > 80) return false;
    return true;
  }
}

// Export
window.MonitoringController = MonitoringController;
window.MonitoringPage = MonitoringPage;
window.MetricCards = MetricCards;
window.MonitoringMetricCard = MonitoringMetricCard;
window.PerformanceChart = PerformanceChart;
window.SystemHealthSummary = SystemHealthSummary;
