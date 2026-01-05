/**
 * Logs Page Controller
 */

class LogsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubscribers = [];
    this.component = null;
    this.filters = {
      level: 'all',
      search: ''
    };
    this.autoScroll = true;
  }

  init() {
    this.unsubscribers.push(
      stateManager.subscribe('logs', this.onLogsChange.bind(this))
    );

    this.loadLogs();
  }

  async loadLogs() {
    try {
      const data = await stateManager.getLogs({ limit: 100 });
      stateManager.set('logs', data.logs || []);
    } catch (error) {
      console.error('[Logs] Failed to load logs:', error);
    }
  }

  onLogsChange(logs) {
    if (this.component) {
      this.component.updateLogs(logs);
      if (this.autoScroll) {
        this.component.scrollToBottom();
      }
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
    this.component = new LogsPage({
      logs: stateManager.get('logs') || [],
      filters: this.filters
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
 * Logs Page Component
 */
class LogsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logs: props.logs || [],
      filters: props.filters || { level: 'all', search: '' },
      autoScroll: true
    };
    this.logsContainer = null;
  }

  render() {
    return Component.h('div', { className: 'logs-page' },
      Component.h('div', { className: 'logs-toolbar' },
        Component.h('div', { className: 'logs-actions' },
          Component.h('button', {
            className: 'btn btn-secondary',
            'data-action': 'export'
          }, 'Export'),
          Component.h('button', {
            className: 'btn btn-danger',
            'data-action': 'clear'
          }, 'Clear Logs')
        ),
        Component.h('div', { className: 'logs-filters' },
          Component.h('select', {
            className: 'filter-select',
            'data-field': 'level'
          },
            Component.h('option', { value: 'all' }, 'All Levels'),
            Component.h('option', { value: 'info' }, 'Info'),
            Component.h('option', { value: 'warn' }, 'Warning'),
            Component.h('option', { value: 'error' }, 'Error'),
            Component.h('option', { value: 'debug' }, 'Debug')
          ),
          Component.h('input', {
            type: 'text',
            className: 'search-input',
            placeholder: 'Search logs...',
            'data-field': 'search'
          })
        ),
        Component.h('div', { className: 'logs-options' },
          Component.h('label', { className: 'checkbox-label' },
            Component.h('input', {
              type: 'checkbox',
              checked: this.state.autoScroll,
              onChange: (e) => this.setState({ autoScroll: e.target.checked })
            }),
            'Auto-scroll'
          )
        )
      ),
      Component.h('div', {
        className: 'logs-container',
        ref: (el) => { this.logsContainer = el; }
      },
        this.getFilteredLogs().length > 0 ? this.getFilteredLogs().map(log => Component.h(LogEntry, {
          key: log.id,
          entry: log
        })) : Component.h('div', { className: 'logs-empty' },
          Component.h('p', {}, 'No logs to display')
        )
      )
    );
  }

  getFilteredLogs() {
    let logs = [...this.state.logs];

    if (this.state.filters.level !== 'all') {
      logs = logs.filter(log => log.level === this.state.filters.level);
    }

    if (this.state.filters.search) {
      const search = this.state.filters.search.toLowerCase();
      logs = logs.filter(log => {
        const message = typeof log.message === 'string' ? log.message : JSON.stringify(log.message);
        return message.toLowerCase().includes(search);
      });
    }

    return logs;
  }

  updateLogs(logs) {
    this.setState({ logs });
  }

  scrollToBottom() {
    if (this.logsContainer && this.state.autoScroll) {
      this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
    }
  }

  getEventMap() {
    return {
      'input [data-field="search"]': 'handleSearchChange',
      'change [data-field="level"]': 'handleLevelChange',
      'click [data-action="export"]': 'handleExport',
      'click [data-action="clear"]': 'handleClear'
    };
  }

  handleSearchChange(event) {
    this.setState({
      filters: { ...this.state.filters, search: event.target.value }
    });
  }

  handleLevelChange(event) {
    this.setState({
      filters: { ...this.state.filters, level: event.target.value }
    });
  }

  handleExport() {
    const logs = this.getFilteredLogs();
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Logs exported', 'success');
  }

  handleClear() {
    if (confirm('Clear all logs?')) {
      stateManager.clearLogs().then(() => {
        stateManager.set('logs', []);
        showNotification('Logs cleared', 'success');
      }).catch(err => {
        showNotification('Failed to clear logs: ' + err.message, 'error');
      });
    }
  }
}

/**
 * Log Entry Component
 */
class LogEntry extends Component {
  constructor(props) {
    super(props);
    this.state = { entry: props.entry || {} };
  }

  render() {
    const entry = this.state.entry;
    const levelClass = `log-level-${entry.level || 'info'}`;

    const message = typeof entry.message === 'string'
      ? entry.message
      : JSON.stringify(entry.message, null, 2);

    return Component.h('div', { className: `log-entry ${levelClass}` },
      Component.h('span', { className: 'log-timestamp' },
        this.formatTimestamp(entry.timestamp)
      ),
      Component.h('span', { className: 'log-level' }, (entry.level || 'info').toUpperCase()),
      Component.h('span', { className: 'log-message' }, message),
      entry.source ? Component.h('span', { className: 'log-source' }, entry.source) : null
    );
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return '--:--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + String(date.getMilliseconds()).padStart(3, '0');
  }
}

// Export
window.LogsController = LogsController;
window.LogsPage = LogsPage;
window.LogEntry = LogEntry;
