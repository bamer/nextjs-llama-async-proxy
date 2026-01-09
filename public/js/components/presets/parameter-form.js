/**
 * ParameterForm Component
 * Main form component that organizes parameters by category with filtering and validation
 */

class ParameterForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      config: props.config || {},
      defaults: props.defaults || {},
      inheritance: props.inheritance || {},
      editableFields: props.editableFields || null,
      expandedSections: {},
      filter: "",
      validationResults: {},
      validationSummary: null,
      showValidationSummary: false,
    };

    // Track all parameters for validation
    this._allParameters = window.getAllParameters();
    this._changedFields = new Set();
    this._validationErrors = {};
    this._validationWarnings = {};
  }

  get initialState() {
    return {
      config: this.props.config || {},
      defaults: this.props.defaults || {},
      inheritance: this.props.inheritance || {},
      editableFields: this.props.editableFields || null,
      expandedSections: this.getDefaultExpandedSections(),
      filter: "",
      validationResults: {},
      validationSummary: null,
      showValidationSummary: false,
    };
  }

  getDefaultExpandedSections() {
    // Default: expand first section only
    const sections = {};
    const categoryIds = window.getCategoryIds();
    categoryIds.forEach((catId, index) => {
      sections[catId] = index === 0; // First section expanded by default
    });
    return sections;
  }

  getEventMap() {
    return {
      "input [data-action=filter-params]": "handleFilterChange",
      "click [data-action=toggle-section]": "handleSectionToggle",
      "click [data-action=expand-all-sections]": "handleExpandAll",
      "click [data-action=collapse-all-sections]": "handleCollapseAll",
      "click [data-action=apply-changes]": "handleApply",
      "click [data-action=reset-all]": "handleResetAll",
      "click [data-action=show-validation]": "handleToggleValidation",
    };
  }

  handleFilterChange(e) {
    const filter = e.target.value.toLowerCase().trim();
    this.setState({ filter });
  }

  handleSectionToggle(e) {
    const sectionEl = e.target.closest(".parameter-section");
    if (!sectionEl) return;

    const sectionId = sectionEl.dataset.sectionId;
    if (!sectionId) return;

    this.setState((prev) => ({
      expandedSections: {
        ...prev.expandedSections,
        [sectionId]: !prev.expandedSections[sectionId],
      },
    }));
  }

  handleExpandAll() {
    const categoryIds = window.getCategoryIds();
    const allExpanded = {};
    categoryIds.forEach((catId) => {
      allExpanded[catId] = true;
    });
    this.setState({ expandedSections: allExpanded });
  }

  handleCollapseAll() {
    const categoryIds = window.getCategoryIds();
    const allCollapsed = {};
    categoryIds.forEach((catId) => {
      allExpanded[catId] = false;
    });
    this.setState({ expandedSections: allCollapsed });
  }

  handleApply() {
    // Final validation before apply
    const validation = window.validateAll(this.state.config, this._allParameters);
    if (!validation.valid) {
      this.setState({
        validationResults: validation.errors,
        validationSummary: window.createValidationSummary(validation),
        showValidationSummary: true,
      });
      showNotification("Please fix validation errors before applying", "warning");
      return;
    }

    // Emit change event
    if (this.props.onChange) {
      this.props.onChange(this.state.config, {
        changed: Array.from(this._changedFields),
        validation: {
          valid: true,
          errors: {},
          warnings: {},
        },
      });
    }

    showNotification("Settings applied successfully", "success");
  }

  handleResetAll() {
    if (!confirm("Reset all parameters to defaults?")) return;

    const resetConfig = {};
    Object.keys(this._allParameters).forEach((paramId) => {
      const param = this._allParameters[paramId];
      if (param.default !== undefined) {
        resetConfig[paramId] = param.default;
      }
    });

    this._changedFields.clear();
    this._validationErrors = {};
    this._validationWarnings = {};

    this.setState({
      config: resetConfig,
      validationResults: {},
      validationSummary: null,
    });

    if (this.props.onChange) {
      this.props.onChange(resetConfig, {
        changed: [],
        validation: { valid: true, errors: {}, warnings: {} },
      });
    }

    showNotification("All settings reset to defaults", "info");
  }

  handleToggleValidation() {
    this.setState({ showValidationSummary: !this.state.showValidationSummary });
  }

  render() {
    const { filter, expandedSections, validationSummary, showValidationSummary } = this.state;

    // Filter parameters based on search
    const filteredCategories = this.filterCategories(filter);

    // Count total parameters
    const totalParams = Object.keys(this._allParameters).length;
    const filteredCount = Object.values(filteredCategories).reduce(
      (sum, cat) => sum + Object.keys(cat.parameters).length,
      0
    );

    return Component.h(
      "div",
      { className: "parameter-form" },
      this.renderToolbar(filter, totalParams, filteredCount, showValidationSummary),
      this.renderValidationBanner(validationSummary, showValidationSummary),
      this.renderCategories(filteredCategories)
    );
  }

  renderToolbar(filter, totalParams, filteredCount, showValidationSummary) {
    return Component.h(
      "div",
      { className: "form-toolbar" },
      Component.h(
        "div",
        { className: "toolbar-left" },
        Component.h(
          "div",
          { className: "search-input-wrapper" },
          Component.h("span", { className: "search-icon" }, "🔍"),
          Component.h("input", {
            type: "text",
            className: "search-input",
            placeholder: "Search parameters...",
            value: filter,
            "data-action": "filter-params",
          })
        ),
        Component.h(
          "span",
          { className: "param-count" },
          `${filteredCount} of ${totalParams} parameters`
        )
      ),
      Component.h(
        "div",
        { className: "toolbar-right" },
        Component.h(
          "button",
          {
            type: "button",
            className: "btn btn-outline btn-sm",
            "data-action": "expand-all-sections",
          },
          "Expand All"
        ),
        Component.h(
          "button",
          {
            type: "button",
            className: "btn btn-outline btn-sm",
            "data-action": "collapse-all-sections",
          },
          "Collapse All"
        ),
        Component.h(
          "button",
          {
            type: "button",
            className: "btn btn-outline btn-sm",
            "data-action": "reset-all",
          },
          "Reset All"
        ),
        this.state.validationSummary?.hasErrors
          ? Component.h(
              "button",
              {
                type: "button",
                className: "btn btn-warning btn-sm",
                "data-action": "show-validation",
              },
              `Show Errors (${this.state.validationSummary.errorCount})`
            )
          : null,
        Component.h(
          "button",
          {
            type: "button",
            className: "btn btn-primary btn-sm",
            "data-action": "apply-changes",
          },
          "Apply Changes"
        )
      )
    );
  }

  renderValidationBanner(validationSummary, expanded) {
    if (!expanded || !validationSummary) return null;

    const isValid = validationSummary.isValid;

    return Component.h(
      "div",
      {
        className: `validation-banner banner-${isValid ? "valid" : "error"}`,
      },
      Component.h(
        "div",
        { className: "banner-content" },
        Component.h("span", { className: "banner-icon" }, isValid ? "✓" : "⚠"),
        Component.h(
          "div",
          { className: "banner-text" },
          isValid
            ? Component.h("strong", {}, "All parameters valid")
            : Component.h(
                "div",
                {},
                Component.h("strong", {}, `${validationSummary.errorCount} error(s) found`),
                validationSummary.warningCount > 0
                  ? Component.h("span", {}, `, ${validationSummary.warningCount} warning(s)`)
                  : null
              ),
          !isValid && validationSummary.errorFields.length > 0
            ? Component.h(
                "ul",
                { className: "banner-errors" },
                validationSummary.errorFields
                  .slice(0, 5)
                  .map((field) => Component.h("li", { key: field }, field)),
                validationSummary.errorFields.length > 5
                  ? Component.h("li", {}, `...and ${validationSummary.errorFields.length - 5} more`)
                  : null
              )
            : null
        )
      )
    );
  }

  renderCategories(filteredCategories) {
    const categoryIds = Object.keys(filteredCategories);

    if (categoryIds.length === 0) {
      return Component.h(
        "div",
        { className: "no-results" },
        Component.h("p", {}, `No parameters matching "${this.state.filter}"`)
      );
    }

    return Component.h(
      "div",
      { className: "sections-container" },
      categoryIds.map((categoryId) =>
        this.renderCategory(categoryId, filteredCategories[categoryId])
      )
    );
  }

  renderCategory(categoryId, categoryInfo) {
    const { config, defaults, inheritance, editableFields, expandedSections, filter } = this.state;
    const expanded = expandedSections[categoryId];

    // Get parameters for this category
    const parameters = categoryInfo.parameters;

    // Apply filter to parameters
    const filteredParams = this.filterParameters(parameters, filter);

    if (Object.keys(filteredParams).length === 0) {
      return null;
    }

    const ParameterSection = window.ParameterSection;

    return Component.h(
      "div",
      {
        key: categoryId,
        className: "category-wrapper",
        "data-section-id": categoryId,
      },
      Component.h(ParameterSection, {
        categoryId,
        categoryInfo,
        parameters: filteredParams,
        config,
        defaults,
        inheritance,
        editableFields,
        expanded,
        onChange: (field, value) => this.handleParamChange(field, value),
        onValidate: (field, validation) => this.handleParamValidation(field, validation),
      })
    );
  }

  filterCategories(filter) {
    if (!filter) {
      return window.ParameterCategories;
    }

    const filtered = {};
    const filterLower = filter.toLowerCase();

    Object.entries(window.ParameterCategories).forEach(([catId, category]) => {
      const matchingParams = {};
      let hasMatchingParams = false;

      Object.entries(category.parameters).forEach(([paramId, param]) => {
        const matchesLabel = param.label.toLowerCase().includes(filterLower);
        const matchesId = paramId.toLowerCase().includes(filterLower);
        const matchesDesc = param.description?.toLowerCase().includes(filterLower);
        const matchesCli = param.cliFlag?.toLowerCase().includes(filterLower);

        if (matchesLabel || matchesId || matchesDesc || matchesCli) {
          matchingParams[paramId] = param;
          hasMatchingParams = true;
        }
      });

      if (hasMatchingParams) {
        filtered[catId] = {
          ...category,
          parameters: matchingParams,
        };
      }
    });

    return filtered;
  }

  filterParameters(parameters, filter) {
    if (!filter) return parameters;

    const filterLower = filter.toLowerCase();
    const filtered = {};

    Object.entries(parameters).forEach(([paramId, param]) => {
      const matchesLabel = param.label.toLowerCase().includes(filterLower);
      const matchesId = paramId.toLowerCase().includes(filterLower);
      const matchesDesc = param.description?.toLowerCase().includes(filterLower);
      const matchesCli = param.cliFlag?.toLowerCase().includes(filterLower);

      if (matchesLabel || matchesId || matchesDesc || matchesCli) {
        filtered[paramId] = param;
      }
    });

    return filtered;
  }

  handleParamChange(field, value) {
    this._changedFields.add(field);

    this.setState((prev) => ({
      config: {
        ...prev.config,
        [field]: value,
      },
    }));

    if (this.props.onChange) {
      this.props.onChange(field, value);
    }
  }

  handleParamValidation(field, validation) {
    if (validation.errors.length > 0) {
      this._validationErrors[field] = validation.errors;
    } else {
      delete this._validationErrors[field];
    }

    if (validation.warnings.length > 0) {
      this._validationWarnings[field] = validation.warnings;
    } else {
      delete this._validationWarnings[field];
    }

    const validationSummary = window.createValidationSummary({
      errors: this._validationErrors,
      warnings: this._validationWarnings,
    });

    this.setState({ validationSummary });

    if (this.props.onValidate) {
      this.props.onValidate(field, validation);
    }
  }

  // Public API
  setConfig(config) {
    this.setState({ config });
  }

  getConfig() {
    return this.state.config;
  }

  getChangedFields() {
    return Array.from(this._changedFields);
  }

  validate() {
    const result = window.validateAll(this.state.config, this._allParameters);
    this.setState({
      validationResults: result.errors,
      validationSummary: result,
    });
    return result;
  }

  reset() {
    this._changedFields.clear();
    this._validationErrors = {};
    this._validationWarnings = {};
    this.setState({
      config: this.props.config || {},
      validationResults: {},
      validationSummary: null,
    });
  }
}

window.ParameterForm = ParameterForm;
