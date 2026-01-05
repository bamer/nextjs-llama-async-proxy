/**
 * Models Page Controller
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubscribers = [];
    this.component = null;
    this.filters = {
      status: 'all',
      search: ''
    };
  }

  init() {
    this.unsubscribers.push(
      stateManager.subscribe('models', this.onModelsChange.bind(this))
    );

    this.loadModels();
  }

  async loadModels() {
    try {
      const data = await stateManager.getModels();
      stateManager.set('models', data.models || []);
    } catch (error) {
      console.error('[Models] Failed to load models:', error);
      showNotification('Failed to load models', 'error');
    }
  }

  onModelsChange(models) {
    if (this.component) {
      this.component.updateModelList(models);
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
    this.component = new ModelsPage({
      models: stateManager.get('models') || [],
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
 * Models Page Component
 */
class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models || [],
      filters: props.filters || { status: 'all', search: '' },
      selectedModel: null,
      showDetails: false
    };
  }

  render() {
    return Component.h('div', { className: 'models-page' },
      Component.h('div', { className: 'models-toolbar' },
        Component.h('div', { className: 'models-actions' },
          Component.h('button', {
            className: 'btn btn-primary',
            'data-action': 'import'
          }, 'Import Models'),
          Component.h('button', {
            className: 'btn btn-secondary',
            'data-action': 'refresh'
          }, 'Refresh')
        )
      ),
      Component.h('div', { className: 'models-filters' },
        Component.h('input', {
          type: 'text',
          className: 'search-input',
          placeholder: 'Search models...',
          value: this.state.filters.search,
          'data-field': 'search'
        }),
        Component.h('select', {
          className: 'filter-select',
          'data-field': 'status'
        },
          Component.h('option', { value: 'all' }, 'All Status'),
          Component.h('option', { value: 'running' }, 'Running'),
          Component.h('option', { value: 'idle' }, 'Idle'),
          Component.h('option', { value: 'loading' }, 'Loading'),
          Component.h('option', { value: 'error' }, 'Error')
        )
      ),
      Component.h('div', { className: 'models-content' },
        Component.h(ModelsTable, {
          models: this.getFilteredModels(),
          onSelect: this.handleModelSelect.bind(this),
          onStart: this.handleStartModel.bind(this),
          onStop: this.handleStopModel.bind(this),
          onDelete: this.handleDeleteModel.bind(this)
        }),
        this.state.showDetails && this.state.selectedModel ? Component.h(ModelDetailsPanel, {
          model: this.state.selectedModel,
          onClose: this.handleCloseDetails.bind(this)
        }) : null
      )
    );
  }

  getFilteredModels() {
    let models = [...this.state.models];

    if (this.state.filters.status !== 'all') {
      models = models.filter(m => m.status === this.state.filters.status);
    }

    if (this.state.filters.search) {
      const search = this.state.filters.search.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(search) ||
        m.type.toLowerCase().includes(search)
      );
    }

    return models;
  }

  updateModelList(models) {
    this.setState({ models });
  }

  getEventMap() {
    return {
      'input [data-field="search"]': 'handleSearchChange',
      'change [data-field="status"]': 'handleStatusChange',
      'click [data-action="import"]': 'handleImport',
      'click [data-action="refresh"]': 'handleRefresh'
    };
  }

  handleSearchChange(event) {
    this.setState({
      filters: { ...this.state.filters, search: event.target.value }
    });
  }

  handleStatusChange(event) {
    this.setState({
      filters: { ...this.state.filters, status: event.target.value }
    });
  }

  handleImport() {
    stateManager.request('models:import').then(result => {
      showNotification(`Imported ${result.imported} models`, 'success');
      this.loadModels();
    }).catch(err => {
      showNotification('Failed to import models: ' + err.message, 'error');
    });
  }

  handleRefresh() {
    this.loadModels();
  }

  handleModelSelect(model) {
    this.setState({ selectedModel: model, showDetails: true });
  }

  handleStartModel(model) {
    stateManager.startModel(model.id).then(() => {
      showNotification(`Starting ${model.name}...`, 'success');
    }).catch(err => {
      showNotification('Failed to start model: ' + err.message, 'error');
    });
  }

  handleStopModel(model) {
    stateManager.stopModel(model.id).then(() => {
      showNotification(`Stopping ${model.name}...`, 'success');
    }).catch(err => {
      showNotification('Failed to stop model: ' + err.message, 'error');
    });
  }

  handleDeleteModel(model) {
    if (confirm(`Delete model "${model.name}"?`)) {
      stateManager.deleteModel(model.id).then(() => {
        showNotification('Model deleted', 'success');
        if (this.state.selectedModel?.id === model.id) {
          this.setState({ selectedModel: null, showDetails: false });
        }
      }).catch(err => {
        showNotification('Failed to delete model: ' + err.message, 'error');
      });
    }
  }

  handleCloseDetails() {
    this.setState({ selectedModel: null, showDetails: false });
  }
}

/**
 * Models Table Component
 */
class ModelsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models || [],
      onSelect: props.onSelect || (() => {}),
      onStart: props.onStart || (() => {}),
      onStop: props.onStop || (() => {}),
      onDelete: props.onDelete || (() => {})
    };
  }

  render() {
    const models = this.state.models;

    if (models.length === 0) {
      return Component.h('div', { className: 'models-table-empty' },
        Component.h('p', {}, 'No models found'),
        Component.h('button', {
          className: 'btn btn-primary',
          'data-action': 'import'
        }, 'Import Models')
      );
    }

    return Component.h('table', { className: 'models-table' },
      Component.h('thead', {},
        Component.h('tr', {},
          Component.h('th', {}, 'Name'),
          Component.h('th', {}, 'Type'),
          Component.h('th', {}, 'Status'),
          Component.h('th', {}, 'Actions')
        )
      ),
      Component.h('tbody', {},
        models.map(model => Component.h(ModelTableRow, {
          key: model.id,
          model,
          onSelect: () => this.state.onSelect(model),
          onStart: () => this.state.onStart(model),
          onStop: () => this.state.onStop(model),
          onDelete: () => this.state.onDelete(model)
        }))
      )
    );
  }
}

/**
 * Model Table Row Component
 */
class ModelTableRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      model: props.model,
      onSelect: props.onSelect || (() => {}),
      onStart: props.onStart || (() => {}),
      onStop: props.onStop || (() => {}),
      onDelete: props.onDelete || (() => {})
    };
  }

  render() {
    const model = this.state.model;
    const statusClass = `status-${model.status || 'idle'}`;

    return Component.h('tr', {},
      Component.h('td', { className: 'model-name' },
        Component.h('span', { className: 'model-name-text' }, model.name),
        model.template ? Component.h('span', { className: 'model-template-badge' }, model.template) : null
      ),
      Component.h('td', { className: 'model-type' }, model.type || 'llama'),
      Component.h('td', {},
        Component.h('span', { className: `status-badge ${statusClass}` }, model.status || 'idle')
      ),
      Component.h('td', { className: 'model-actions' },
        Component.h('button', {
          className: 'btn btn-sm btn-icon',
          'data-action': 'select',
          title: 'View Details'
        }, '👁️'),
        model.status === 'running' ?
          Component.h('button', {
            className: 'btn btn-sm btn-warning',
            'data-action': 'stop',
            title: 'Stop Model'
          }, 'Stop') :
          Component.h('button', {
            className: 'btn btn-sm btn-success',
            'data-action': 'start',
            title: 'Start Model'
          }, 'Start'),
        Component.h('button', {
          className: 'btn btn-sm btn-danger',
          'data-action': 'delete',
          title: 'Delete Model'
        }, '🗑️')
      )
    );
  }

  getEventMap() {
    return {
      'click [data-action="select"]': 'handleSelect',
      'click [data-action="start"]': 'handleStart',
      'click [data-action="stop"]': 'handleStop',
      'click [data-action="delete"]': 'handleDelete'
    };
  }

  handleSelect() {
    this.state.onSelect();
  }

  handleStart() {
    this.state.onStart();
  }

  handleStop() {
    this.state.onStop();
  }

  handleDelete() {
    this.state.onDelete();
  }
}

/**
 * Model Details Panel Component
 */
class ModelDetailsPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      model: props.model || {},
      onClose: props.onClose || (() => {})
    };
  }

  render() {
    const model = this.state.model;

    return Component.h('div', { className: 'model-details-panel' },
      Component.h('div', { className: 'panel-header' },
        Component.h('h3', {}, model.name),
        Component.h('button', {
          className: 'btn btn-close',
          'data-action': 'close'
        }, '×')
      ),
      Component.h('div', { className: 'panel-content' },
        Component.h('div', { className: 'detail-row' },
          Component.h('span', { className: 'label' }, 'Type:'),
          Component.h('span', { className: 'value' }, model.type || 'llama')
        ),
        Component.h('div', { className: 'detail-row' },
          Component.h('span', { className: 'label' }, 'Status:'),
          Component.h('span', { className: `status-badge status-${model.status || 'idle'}` },
            model.status || 'idle'
          )
        ),
        Component.h('div', { className: 'detail-row' },
          Component.h('span', { className: 'label' }, 'Created:'),
          Component.h('span', { className: 'value' }, model.createdAt || 'N/A')
        ),
        Component.h('div', { className: 'detail-row' },
          Component.h('span', { className: 'label' }, 'Updated:'),
          Component.h('span', { className: 'value' }, model.updatedAt || 'N/A')
        ),
        model.parameters ? Component.h('div', { className: 'params-section' },
          Component.h('h4', {}, 'Parameters'),
          Component.h('pre', { className: 'params-json' },
            JSON.stringify(model.parameters, null, 2)
          )
        ) : null
      ),
      Component.h('div', { className: 'panel-actions' },
        Component.h('button', { className: 'btn btn-primary' }, 'Configure'),
        Component.h('button', { className: 'btn btn-secondary' }, 'View Logs')
      )
    );
  }

  getEventMap() {
    return {
      'click [data-action="close"]': 'handleClose'
    };
  }

  handleClose() {
    this.state.onClose();
  }
}

// Export
window.ModelsController = ModelsController;
window.ModelsPage = ModelsPage;
window.ModelsTable = ModelsTable;
window.ModelTableRow = ModelTableRow;
window.ModelDetailsPanel = ModelDetailsPanel;
