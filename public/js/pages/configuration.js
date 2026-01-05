/**
 * Configuration Page Controller
 */

class ConfigurationController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubscribers = [];
    this.component = null;
    this.activeTab = 'general';
  }

  init() {
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const data = await stateManager.getConfig();
      stateManager.set('config', data.config || null);
    } catch (error) {
      console.error('[Configuration] Failed to load config:', error);
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
    this.component = new ConfigurationPage({
      config: stateManager.get('config') || this.getDefaultConfig(),
      activeTab: this.activeTab
    });

    this.init();

    return this.component.render();
  }

  getDefaultConfig() {
    return {
      serverPath: '',
      host: 'localhost',
      port: 8080,
      baseModelsPath: '',
      ctx_size: 2048,
      batch_size: 512,
      threads: 4,
      autoStart: false
    };
  }

  didMount() {
    if (this.component && this.component.didMount) {
      this.component.didMount();
    }
  }
}

/**
 * Configuration Page Component
 */
class ConfigurationPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      config: props.config || {},
      activeTab: props.activeTab || 'general',
      saving: false,
      error: null
    };
  }

  render() {
    return Component.h('div', { className: 'configuration-page' },
      Component.h('div', { className: 'configuration-toolbar' },
        Component.h('div', { className: 'configuration-actions' },
          Component.h('button', {
            className: 'btn btn-secondary',
            'data-action': 'reset'
          }, 'Reset to Defaults'),
          Component.h('button', {
            className: 'btn btn-primary',
            'data-action': 'save'
          }, 'Save Changes')
        )
      ),
      Component.h('div', { className: 'configuration-layout' },
        Component.h('div', { className: 'config-tabs' },
          Component.h('button', {
            className: `tab-button ${this.state.activeTab === 'general' ? 'active' : ''}`,
            'data-tab': 'general'
          }, 'General'),
          Component.h('button', {
            className: `tab-button ${this.state.activeTab === 'server' ? 'active' : ''}`,
            'data-tab': 'server'
          }, 'Server'),
          Component.h('button', {
            className: `tab-button ${this.state.activeTab === 'model-defaults' ? 'active' : ''}`,
            'data-tab': 'model-defaults'
          }, 'Model Defaults'),
          Component.h('button', {
            className: `tab-button ${this.state.activeTab === 'advanced' ? 'active' : ''}`,
            'data-tab': 'advanced'
          }, 'Advanced')
        ),
        Component.h('div', { className: 'config-content' },
          this.state.activeTab === 'general' ? Component.h(GeneralSettingsSection, {
            config: this.state.config,
            onChange: this.handleConfigChange.bind(this)
          }) : null,
          this.state.activeTab === 'server' ? Component.h(ServerSettingsSection, {
            config: this.state.config,
            onChange: this.handleConfigChange.bind(this)
          }) : null,
          this.state.activeTab === 'model-defaults' ? Component.h(ModelDefaultsSection, {
            config: this.state.config,
            onChange: this.handleConfigChange.bind(this)
          }) : null,
          this.state.activeTab === 'advanced' ? Component.h(AdvancedSettingsSection, {
            config: this.state.config,
            onChange: this.handleConfigChange.bind(this)
          }) : null
        )
      ),
      this.state.error ? Component.h('div', { className: 'config-error' },
        this.state.error
      ) : null
    );
  }

  handleConfigChange(path, value) {
    const config = { ...this.state.config };
    const parts = path.split('.');
    let current = config;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = { ...current[parts[i]] };
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    this.setState({ config });
  }

  getEventMap() {
    return {
      'click [data-tab]': 'handleTabChange',
      'click [data-action="save"]': 'handleSave',
      'click [data-action="reset"]': 'handleReset'
    };
  }

  handleTabChange(event) {
    this.setState({ activeTab: event.target.dataset.tab });
  }

  async handleSave() {
    this.setState({ saving: true, error: null });
    try {
      await stateManager.updateConfig(this.state.config);
      showNotification('Configuration saved successfully', 'success');
    } catch (error) {
      this.setState({ error: 'Failed to save configuration: ' + error.message });
      showNotification('Failed to save configuration', 'error');
    } finally {
      this.setState({ saving: false });
    }
  }

  handleReset() {
    if (confirm('Reset all settings to defaults?')) {
      this.setState({ config: this.getDefaultConfig() });
    }
  }

  getDefaultConfig() {
    return {
      serverPath: '',
      host: 'localhost',
      port: 8080,
      baseModelsPath: '',
      ctx_size: 2048,
      batch_size: 512,
      threads: 4,
      autoStart: false
    };
  }
}

/**
 * General Settings Section
 */
class GeneralSettingsSection extends Component {
  constructor(props) {
    super(props);
    this.state = { config: props.config || {} };
  }

  render() {
    return Component.h('div', { className: 'config-section' },
      Component.h('h3', {}, 'General Settings'),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Auto-start Server'),
        Component.h('input', {
          type: 'checkbox',
          checked: this.state.config.autoStart || false,
          onChange: (e) => this.props.onChange('autoStart', e.target.checked)
        })
      )
    );
  }
}

/**
 * Server Settings Section
 */
class ServerSettingsSection extends Component {
  constructor(props) {
    super(props);
    this.state = { config: props.config || {} };
  }

  render() {
    return Component.h('div', { className: 'config-section' },
      Component.h('h3', {}, 'Server Settings'),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Server Path'),
        Component.h('input', {
          type: 'text',
          value: this.state.config.serverPath || '',
          placeholder: '/path/to/llama-server',
          onChange: (e) => this.props.onChange('serverPath', e.target.value)
        })
      ),
      Component.h('div', { className: 'form-row' },
        Component.h('div', { className: 'form-group' },
          Component.h('label', {}, 'Host'),
          Component.h('input', {
            type: 'text',
            value: this.state.config.host || 'localhost',
            onChange: (e) => this.props.onChange('host', e.target.value)
          })
        ),
        Component.h('div', { className: 'form-group' },
          Component.h('label', {}, 'Port'),
          Component.h('input', {
            type: 'number',
            value: this.state.config.port || 8080,
            onChange: (e) => this.props.onChange('port', parseInt(e.target.value))
          })
        )
      ),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'Models Path'),
        Component.h('input', {
          type: 'text',
          value: this.state.config.baseModelsPath || '',
          placeholder: '/path/to/models',
          onChange: (e) => this.props.onChange('baseModelsPath', e.target.value)
        })
      )
    );
  }
}

/**
 * Model Defaults Section
 */
class ModelDefaultsSection extends Component {
  constructor(props) {
    super(props);
    this.state = { config: props.config || {} };
  }

  render() {
    return Component.h('div', { className: 'config-section' },
      Component.h('h3', {}, 'Model Defaults'),
      Component.h('div', { className: 'form-row' },
        Component.h('div', { className: 'form-group' },
          Component.h('label', {}, 'Context Size'),
          Component.h('input', {
            type: 'number',
            value: this.state.config.ctx_size || 2048,
            onChange: (e) => this.props.onChange('ctx_size', parseInt(e.target.value))
          })
        ),
        Component.h('div', { className: 'form-group' },
          Component.h('label', {}, 'Batch Size'),
          Component.h('input', {
            type: 'number',
            value: this.state.config.batch_size || 512,
            onChange: (e) => this.props.onChange('batch_size', parseInt(e.target.value))
          })
        ),
        Component.h('div', { className: 'form-group' },
          Component.h('label', {}, 'Threads'),
          Component.h('input', {
            type: 'number',
            value: this.state.config.threads || 4,
            onChange: (e) => this.props.onChange('threads', parseInt(e.target.value))
          })
        )
      )
    );
  }
}

/**
 * Advanced Settings Section
 */
class AdvancedSettingsSection extends Component {
  constructor(props) {
    super(props);
    this.state = { config: props.config || {} };
  }

  render() {
    return Component.h('div', { className: 'config-section' },
      Component.h('h3', {}, 'Advanced Settings'),
      Component.h('p', { className: 'config-warning' },
        'These settings can affect performance and stability. Change with caution.'
      ),
      Component.h('div', { className: 'form-group' },
        Component.h('label', {}, 'JSON Configuration'),
        Component.h('textarea', {
          className: 'config-json',
          value: JSON.stringify(this.state.config, null, 2),
          onChange: (e) => {
            try {
              const config = JSON.parse(e.target.value);
              this.props.onChange('', config);
            } catch (err) {
              // Invalid JSON, ignore
            }
          }
        })
      )
    );
  }
}

// Export
window.ConfigurationController = ConfigurationController;
window.ConfigurationPage = ConfigurationPage;
window.GeneralSettingsSection = GeneralSettingsSection;
window.ServerSettingsSection = ServerSettingsSection;
window.ModelDefaultsSection = ModelDefaultsSection;
window.AdvancedSettingsSection = AdvancedSettingsSection;
