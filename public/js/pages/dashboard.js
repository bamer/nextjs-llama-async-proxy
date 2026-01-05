/**
 * Dashboard Controller
 */

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.state = stateManager.getState();
    this.unsubscribers = [];
    this.component = null;
  }

  init() {
    // Subscribe to state changes
    this.unsubscribers.push(
      stateManager.subscribe('models', this.onModelsChange.bind(this)),
      stateManager.subscribe('metrics', this.onMetricsChange.bind(this)),
      stateManager.subscribe('llamaStatus', this.onLlamaStatusChange.bind(this))
    );

    // Load initial data
    this.loadData();
  }

  async loadData() {
    try {
      // Load models
      const modelsData = await stateManager.getModels();
      stateManager.set('models', modelsData.models || []);

      // Load metrics
      const metricsData = await stateManager.getMetrics();
      stateManager.set('metrics', metricsData.metrics || null);

      // Load llama status
      const statusData = await stateManager.getLlamaStatus();
      stateManager.set('llamaStatus', statusData.status || null);
    } catch (error) {
      console.error('[Dashboard] Failed to load data:', error);
    }
  }

  onModelsChange(models) {
    if (this.component) {
      this.component.updateModelList(models);
    }
  }

  onMetricsChange(metrics) {
    if (this.component) {
      this.component.updateMetrics(metrics);
    }
  }

  onLlamaStatusChange(status) {
    if (this.component) {
      this.component.updateLlamaStatus(status);
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
    this.component = new DashboardPage({
      models: stateManager.get('models') || [],
      metrics: stateManager.get('metrics') || null,
      llamaStatus: stateManager.get('llamaStatus') || null
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
 * Dashboard Page Component
 */
class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models || [],
      metrics: props.metrics || null,
      llamaStatus: props.llamaStatus || null
    };
  }

  getInitialState() {
    return {
      models: [],
      metrics: null,
      llamaStatus: null,
      activeTab: 'overview'
    };
  }

  render() {
    return Component.h('div', { className: 'dashboard-page' },
      Component.h('div', { className: 'dashboard-content' },
        Component.h('div', { className: 'dashboard-grid' },
          Component.h(ServerStatusCard, { status: this.state.llamaStatus }),
          Component.h(MetricsGrid, { metrics: this.state.metrics }),
          Component.h(ActiveModelsSummary, { models: this.state.models })
        ),
        Component.h(ChartsSection, { metrics: this.state.metrics }),
        Component.h(QuickActionsBar, {})
      )
    );
  }

  updateModelList(models) {
    this.setState({ models });
    const summary = this._element?.querySelector('.active-models-summary');
    if (summary) {
      summary.textContent = `${models.filter(m => m.status === 'running').length} running`;
    }
  }

  updateMetrics(metrics) {
    this.setState({ metrics });
  }

  updateLlamaStatus(status) {
    this.setState({ llamaStatus: status });
  }

  getEventMap() {
    return {
      'click [data-action="refresh"]': 'handleRefresh'
    };
  }

  handleRefresh() {
    stateManager.getModels().then(() => {
      stateManager.getMetrics();
      stateManager.getLlamaStatus();
    });
  }
}

/**
 * Server Status Card Component
 */
class ServerStatusCard extends Component {
  constructor(props) {
    super(props);
    this.state = { status: props.status || { status: 'idle' } };
  }

  render() {
    const status = this.state.status.status || 'idle';
    const statusClass = status === 'running' ? 'status-success' :
                       status === 'starting' ? 'status-warning' :
                       status === 'error' ? 'status-error' : 'status-default';

    return Component.h('div', { className: 'server-status-card card' },
      Component.h('div', { className: 'card-header' },
        Component.h('h3', {}, 'Server Status')
      ),
      Component.h('div', { className: 'card-content' },
        Component.h('div', { className: `status-indicator ${statusClass}` },
          Component.h('span', { className: 'status-dot' }),
          Component.h('span', { className: 'status-text' }, status.toUpperCase())
        ),
        this.state.status.uptime ? Component.h('div', { className: 'uptime' },
          Component.h('span', { className: 'label' }, 'Uptime:'),
          Component.h('span', { className: 'value' }, this.formatUptime(this.state.status.uptime))
        ) : null
      )
    );
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Metrics Grid Component
 */
class MetricsGrid extends Component {
  constructor(props) {
    super(props);
    this.state = { metrics: props.metrics };
  }

  render() {
    const metrics = this.state.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      disk: { used: 0 }
    };

    return Component.h('div', { className: 'metrics-grid' },
      Component.h(MetricCard, {
        title: 'CPU Usage',
        value: `${(metrics.cpu?.usage || 0).toFixed(1)}%`,
        icon: 'cpu'
      }),
      Component.h(MetricCard, {
        title: 'Memory',
        value: window.AppUtils.formatBytes(metrics.memory?.used || 0),
        icon: 'memory'
      }),
      Component.h(MetricCard, {
        title: 'Disk',
        value: `${(metrics.disk?.used || 0).toFixed(1)}%`,
        icon: 'disk'
      }),
      metrics.gpu ? Component.h(MetricCard, {
        title: 'GPU Memory',
        value: window.AppUtils.formatBytes(metrics.gpu.memoryUsed || 0),
        icon: 'gpu'
      }) : null
    );
  }
}

/**
 * Metric Card Component
 */
class MetricCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: props.title,
      value: props.value,
      icon: props.icon
    };
  }

  render() {
    const iconMap = {
      cpu: '💻',
      memory: '🧠',
      disk: '💾',
      gpu: '🎮'
    };

    return Component.h('div', { className: 'metric-card card' },
      Component.h('div', { className: 'metric-icon' }, iconMap[this.state.icon] || '📊'),
      Component.h('div', { className: 'metric-content' },
        Component.h('span', { className: 'metric-title' }, this.state.title),
        Component.h('span', { className: 'metric-value' }, this.state.value)
      )
    );
  }
}

/**
 * Active Models Summary Component
 */
class ActiveModelsSummary extends Component {
  constructor(props) {
    super(props);
    this.state = { models: props.models || [] };
  }

  render() {
    const running = this.state.models.filter(m => m.status === 'running').length;
    const loading = this.state.models.filter(m => m.status === 'loading').length;
    const idle = this.state.models.filter(m => m.status === 'idle').length;

    return Component.h('div', { className: 'active-models-summary card' },
      Component.h('div', { className: 'card-header' },
        Component.h('h3', {}, 'Models Summary')
      ),
      Component.h('div', { className: 'card-content' },
        Component.h('div', { className: 'model-stats' },
          Component.h('div', { className: 'stat stat-running' },
            Component.h('span', { className: 'stat-value' }, running),
            Component.h('span', { className: 'stat-label' }, 'Running')
          ),
          Component.h('div', { className: 'stat stat-loading' },
            Component.h('span', { className: 'stat-value' }, loading),
            Component.h('span', { className: 'stat-label' }, 'Loading')
          ),
          Component.h('div', { className: 'stat stat-idle' },
            Component.h('span', { className: 'stat-value' }, idle),
            Component.h('span', { className: 'stat-label' }, 'Idle')
          )
        )
      )
    );
  }
}

/**
 * Charts Section Component
 */
class ChartsSection extends Component {
  constructor(props) {
    super(props);
    this.state = { metrics: props.metrics };
  }

  render() {
    return Component.h('div', { className: 'charts-section card' },
      Component.h('div', { className: 'card-header' },
        Component.h('h3', {}, 'Performance')
      ),
      Component.h('div', { className: 'card-content' },
        Component.h('div', { className: 'chart-placeholder' },
          Component.h('div', { className: 'chart-line' },
            Array.from({ length: 20 }, (_, i) =>
              Component.h('div', {
                className: 'chart-bar',
                style: { height: `${Math.random() * 80 + 20}%` }
              })
            )
          )
        )
      )
    );
  }
}

/**
 * Quick Actions Bar Component
 */
class QuickActionsBar extends Component {
  render() {
    return Component.h('div', { className: 'quick-actions-bar' },
      Component.h('button', {
        className: 'btn btn-primary',
        'data-action': 'start-server'
      }, 'Start Server'),
      Component.h('button', {
        className: 'btn btn-secondary',
        'data-action': 'import-models'
      }, 'Import Models'),
      Component.h('button', {
        className: 'btn btn-secondary',
        'data-action': 'settings'
      }, 'Settings')
    );
  }

  getEventMap() {
    return {
      'click [data-action="start-server"]': 'handleStartServer',
      'click [data-action="import-models"]': 'handleImportModels',
      'click [data-action="settings"]': 'handleSettings'
    };
  }

  handleStartServer() {
    stateManager.startLlama().then(() => {
      showNotification('Llama server starting...', 'success');
    }).catch(err => {
      showNotification('Failed to start server: ' + err.message, 'error');
    });
  }

  handleImportModels() {
    window.router.navigate('/models');
  }

  handleSettings() {
    window.router.navigate('/settings');
  }
}

/**
 * Not Found Controller
 */
class NotFoundController {
  constructor() {}

  render() {
    return Component.h('div', { className: 'not-found-page' },
      Component.h('h1', {}, '404'),
      Component.h('p', {}, 'Page not found'),
      Component.h('a', { href: '/', className: 'btn btn-primary' }, 'Go Home')
    );
  }
}

// Export
window.DashboardController = DashboardController;
window.DashboardPage = DashboardPage;
window.ServerStatusCard = ServerStatusCard;
window.MetricsGrid = MetricsGrid;
window.MetricCard = MetricCard;
window.ActiveModelsSummary = ActiveModelsSummary;
window.ChartsSection = ChartsSection;
window.QuickActionsBar = QuickActionsBar;
window.NotFoundController = NotFoundController;
