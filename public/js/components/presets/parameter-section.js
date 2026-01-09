/**
 * ParameterSection Component
 * Renders a category accordion section with expandable/collapsible parameters
 */

class ParameterSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: props.expanded !== undefined ? props.expanded : true,
      parameterCount: 0,
    };
  }

  get initialState() {
    return {
      expanded: this.props.expanded !== undefined ? this.props.expanded : true,
      parameterCount: Object.keys(this.props.parameters || {}).length,
    };
  }

  getEventMap() {
    return {
      "click [data-action=toggle-section]": "handleToggle",
      "click [data-action=expand-all]": "handleExpandAll",
      "click [data-action=collapse-all]": "handleCollapseAll",
    };
  }

  handleToggle() {
    this.setState({ expanded: !this.state.expanded });
  }

  handleExpandAll() {
    this.setState({ expanded: true });
  }

  handleCollapseAll() {
    this.setState({ expanded: false });
  }

  render() {
    const { categoryId, categoryInfo, parameters, config, defaults, inheritance, editableFields } =
      this.props;
    const { expanded, parameterCount } = this.state;

    const filteredParameters = this.filterParameters(parameters, config);
    const displayCount = Object.keys(filteredParameters).length;

    return Component.h(
      "div",
      { className: `parameter-section section-${expanded ? "expanded" : "collapsed"}` },
      this.renderHeader(categoryId, categoryInfo, displayCount, expanded),
      expanded
        ? this.renderBody(filteredParameters, config, defaults, inheritance, editableFields)
        : null
    );
  }

  renderHeader(categoryId, categoryInfo, count, expanded) {
    const icon = expanded ? "▼" : "▶";

    return Component.h(
      "div",
      {
        className: "section-header",
        "data-action": "toggle-section",
      },
      Component.h(
        "div",
        { className: "section-title-area" },
        Component.h("span", { className: "section-icon" }, icon),
        Component.h(
          "div",
          { className: "section-title-group" },
          Component.h("h3", { className: "section-title" }, categoryInfo.name),
          Component.h(
            "span",
            { className: "section-subtitle" },
            `${count} parameter${count !== 1 ? "s" : ""}`
          )
        ),
        Component.h("p", { className: "section-description" }, categoryInfo.description)
      ),
      this.renderHeaderActions(count)
    );
  }

  renderHeaderActions(count) {
    if (count === 0) return null;

    return Component.h(
      "div",
      { className: "section-actions" },
      Component.h(
        "button",
        {
          type: "button",
          className: "btn-text btn-sm section-expand-btn",
          "data-action": "expand-all",
          title: "Expand all sections",
        },
        "Expand All"
      ),
      Component.h(
        "button",
        {
          type: "button",
          className: "btn-text btn-sm section-collapse-btn",
          "data-action": "collapse-all",
          title: "Collapse all sections",
        },
        "Collapse All"
      )
    );
  }

  renderBody(parameters, config, defaults, inheritance, editableFields) {
    const paramIds = Object.keys(parameters);

    if (paramIds.length === 0) {
      return Component.h(
        "div",
        { className: "section-body section-empty" },
        Component.h("p", {}, "No parameters in this category")
      );
    }

    const ParameterInput = window.ParameterInput;

    return Component.h(
      "div",
      { className: "section-body" },
      paramIds.map((paramId) => {
        const param = parameters[paramId];
        const value = config[paramId];
        const defaultValue = defaults?.[paramId];
        const paramInheritance = inheritance?.[paramId];

        return Component.h(ParameterInput, {
          key: paramId,
          paramId,
          param,
          value,
          defaultValue,
          inheritance: paramInheritance ? { [paramId]: paramInheritance } : null,
          editableFields,
          onChange: (field, val) => this.handleParamChange(field, val),
          onValidate: (field, validation) => this.handleParamValidation(field, validation),
        });
      })
    );
  }

  filterParameters(parameters, config) {
    if (!config) return parameters;

    // Filter to only show parameters that are either:
    // 1. In the config (have a value)
    // 2. Have a default value
    const filtered = {};
    Object.entries(parameters).forEach(([paramId, param]) => {
      const hasValue = config[paramId] !== undefined;
      const hasDefault = param.default !== undefined;
      if (hasValue || hasDefault) {
        filtered[paramId] = param;
      }
    });
    return filtered;
  }

  handleParamChange(field, value) {
    if (this.props.onChange) {
      this.props.onChange(field, value);
    }
  }

  handleParamValidation(field, validation) {
    if (this.props.onValidate) {
      this.props.onValidate(field, validation);
    }
  }

  // Public method to expand/collapse
  setExpanded(expanded) {
    this.setState({ expanded });
  }

  // Get summary of current values
  getSummary() {
    const { config, parameters } = this.props;
    const summary = {
      total: 0,
      changed: 0,
      errors: 0,
    };

    Object.keys(parameters).forEach((paramId) => {
      if (config?.[paramId] !== undefined) {
        summary.total++;
      }
    });

    return summary;
  }
}

window.ParameterSection = ParameterSection;
