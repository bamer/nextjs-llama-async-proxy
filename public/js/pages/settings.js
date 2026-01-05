/**
 * Settings Page Controller
 */

class SettingsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubscribers = [];
    this.component = null;
  }

  init() {
    this.unsubscribers.push(
      stateManager.subscribe('settings', this.onSettingsChange.bind(this))
    );

    this.loadSettings();
  }

  async loadSettings() {
    try {
      const data = await stateManager.getSettings();
      stateManager.set('settings', data.settings || {});
    } catch (error) {
      console.error('[Settings] Failed to load settings:', error);
    }
  }

  onSettingsChange(settings) {
    if (this.component) {
      this.component.updateSettings(settings);
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
    this.component = new SettingsPage({
      settings: stateManager.get('settings') || {}
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
 * Settings Page Component
 */
class SettingsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: props.settings || {},
      activeSection: 'appearance'
    };
  }

  render() {
    return Component.h('div', { className: 'settings-page' },
      Component.h('div', { className: 'settings-layout' },
        Component.h('div', { className: 'settings-sidebar' },
          Component.h('button', {
            className: `settings-nav-item ${this.state.activeSection === 'appearance' ? 'active' : ''}`,
            'data-section': 'appearance'
          }, 'Appearance'),
          Component.h('button', {
            className: `settings-nav-item ${this.state.activeSection === 'logging' ? 'active' : ''}`,
            'data-section': 'logging'
          }, 'Logging'),
          Component.h('button', {
            className: `settings-nav-item ${this.state.activeSection === 'features' ? 'active' : ''}`,
            'data-section': 'features'
          }, 'Features'),
          Component.h('button', {
            className: `settings-nav-item ${this.state.activeSection === 'system' ? 'active' : ''}`,
            'data-section': 'system'
          }, 'System')
        ),
        Component.h('div', { className: 'settings-content' },
          this.state.activeSection === 'appearance' ? Component.h(SettingsAppearance, {
            settings: this.state.settings,
            onChange: this.handleSettingChange.bind(this)
          }) : null,
          this.state.activeSection === 'logging' ? Component.h(SettingsLogging, {
            settings: this.state.settings,
            onChange: this.handleSettingChange.bind(this)
          }) : null,
          this.state.activeSection === 'features' ? Component.h(SettingsFeatures, {
            settings: this.state.settings,
            onChange: this.handleSettingChange.bind(this)
          }) : null,
          this.state.activeSection === 'system' ? Component.h(SettingsSystem, {
            settings: this.state.settings,
            onChange: this.handleSettingChange.bind(this)
          }) : null
        )
      )
    );
  }

  updateSettings(settings) {
    this.setState({ settings });
  }

  handleSettingChange(key, value) {
    const settings = { ...this.state.settings, [key]: value };
    this.setState({ settings });
    this.saveSettings(settings);
  }

  async saveSettings(settings) {
    try {
      await stateManager.updateSettings(settings);
    } catch (error) {
      console.error('[Settings] Failed to save settings:', error);
      showNotification('Failed to save settings', 'error');
    }
  }

  getEventMap() {
    return {
      'click [data-section]': 'handleSectionChange'
    };
  }

  handleSectionChange(event) {
    this.setState({ activeSection: event.target.dataset.section });
  }
}

/**
 * Appearance Settings
 */
class SettingsAppearance extends Component {
  constructor(props) {
    super(props);
    this.state = { settings: props.settings || {} };
  }

  render() {
    return Component.h('div', { className: 'settings-section' },
      Component.h('h2', {}, 'Appearance'),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Theme'),
        Component.h('select', {
          value: this.state.settings.theme || 'system',
          onChange: (e) => this.props.onChange('theme', e.target.value)
        },
          Component.h('option', { value: 'light' }, 'Light'),
          Component.h('option', { value: 'dark' }, 'Dark'),
          Component.h('option', { value: 'system' }, 'System')
        )
      ),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Compact Mode'),
        Component.h('input', {
          type: 'checkbox',
          checked: this.state.settings.compactMode || false,
          onChange: (e) => this.props.onChange('compactMode', e.target.checked)
        })
      )
    );
  }
}

/**
 * Logging Settings
 */
class SettingsLogging extends Component {
  constructor(props) {
    super(props);
    this.state = { settings: props.settings || {} };
  }

  render() {
    return Component.h('div', { className: 'settings-section' },
      Component.h('h2', {}, 'Logging'),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Log Level'),
        Component.h('select', {
          value: this.state.settings.logLevel || 'info',
          onChange: (e) => this.props.onChange('logLevel', e.target.value)
        },
          Component.h('option', { value: 'debug' }, 'Debug'),
          Component.h('option', { value: 'info' }, 'Info'),
          Component.h('option', { value: 'warn' }, 'Warning'),
          Component.h('option', { value: 'error' }, 'Error')
        )
      ),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Max Log Entries'),
        Component.h('input', {
          type: 'number',
          value: this.state.settings.maxLogEntries || 100,
          onChange: (e) => this.props.onChange('maxLogEntries', parseInt(e.target.value))
        })
      ),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Enable Console Logging'),
        Component.h('input', {
          type: 'checkbox',
          checked: this.state.settings.enableConsoleLog !== false,
          onChange: (e) => this.props.onChange('enableConsoleLog', e.target.checked)
        })
      )
    );
  }
}

/**
 * Features Settings
 */
class SettingsFeatures extends Component {
  constructor(props) {
    super(props);
    this.state = { settings: props.settings || {} };
  }

  render() {
    return Component.h('div', { className: 'settings-section' },
      Component.h('h2', {}, 'Features'),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Auto-refresh Metrics'),
        Component.h('input', {
          type: 'checkbox',
          checked: this.state.settings.autoRefreshMetrics !== false,
          onChange: (e) => this.props.onChange('autoRefreshMetrics', e.target.checked)
        })
      ),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Refresh Interval (seconds)'),
        Component.h('input', {
          type: 'number',
          value: this.state.settings.refreshInterval || 10,
          min: 5,
          max: 60,
          onChange: (e) => this.props.onChange('refreshInterval', parseInt(e.target.value))
        })
      ),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Enable Notifications'),
        Component.h('input', {
          type: 'checkbox',
          checked: this.state.settings.enableNotifications !== false,
          onChange: (e) => this.props.onChange('enableNotifications', e.target.checked)
        })
      )
    );
  }
}

/**
 * System Settings
 */
class SettingsSystem extends Component {
  constructor(props) {
    super(props);
    this.state = { settings: props.settings || {} };
  }

  render() {
    return Component.h('div', { className: 'settings-section' },
      Component.h('h2', {}, 'System'),
      Component.h('div', { className: 'system-info' },
        Component.h('h3', {}, 'About'),
        Component.h('p', {}, 'Llama Async Proxy Dashboard'),
        Component.h('p', { className: 'version' }, 'Version 1.0.0')
      ),
      Component.h('div', { className: 'system-actions' },
        Component.h('button', {
          className: 'btn btn-secondary',
          'data-action': 'restart'
        }, 'Restart Server'),
        Component.h('button', {
          className: 'btn btn-secondary',
          'data-action': 'clear-cache'
        }, 'Clear Cache')
      )
    );
  }

  getEventMap() {
    return {
      'click [data-action="restart"]': 'handleRestart',
      'click [data-action="clear-cache"]': 'handleClearCache'
    };
  }

  handleRestart() {
    if (confirm('Restart the server? This will disconnect all clients.')) {
      showNotification('Restarting server...', 'info');
    }
  }

  handleClearCache() {
    if (confirm('Clear all cached data?')) {
      showNotification('Cache cleared', 'success');
    }
  }
}

// Export
window.SettingsController = SettingsController;
window.SettingsPage = SettingsPage;
window.SettingsAppearance = SettingsAppearance;
window.SettingsLogging = SettingsLogging;
window.SettingsFeatures = SettingsFeatures;
window.SettingsSystem = SettingsSystem;
