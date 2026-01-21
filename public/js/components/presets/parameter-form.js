/**
 * ParameterForm Component - Event-Driven DOM Updates
 * Main form component that organizes parameters by category with filtering and validation
 */

class ParameterForm extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.config = props.config || {};
    this.defaults = props.defaults || {};
    this.inheritance = props.inheritance || {};
    this.editableFields = props.editableFields || null;
    this.expandedSections = this.getDefaultExpandedSections();
    this.filter = "";
    this.validationResults = {};
    this.validationSummary = null;
    this.showValidationSummary = false;

    // Track all parameters for validation
    this._allParameters = window.getAllParameters();
    this._changedFields = new Set();
    this._validationErrors = {};
    this._validationWarnings = {};
  }

  /**
   * Get the default expanded sections state.
   * @returns {Object} Map of category ID to expanded boolean.
   */
  getDefaultExpandedSections() {
    // Default: expand first section only
    const sections = {};
    const categoryIds = window.getCategoryIds();
    categoryIds.forEach((catId, index) => {
      sections[catId] = index === 0; // First section expanded by default
    });
    return sections;
  }

  /**
   * Bind event handlers for filtering, section toggling, apply, and reset actions.
   */
  bindEvents() {
    // Filter input
    this.on("input", "[data-action=filter-params]", (e) => {
      this.handleFilterChange(e);
    });

    // Section toggle
    this.on("click", "[data-action=toggle-section]", (e) => {
      this.handleSectionToggle(e);
    });

    // Expand all sections
    this.on("click", "[data-action=expand-all-sections]", () => {
      this.handleExpandAll();
    });

    // Collapse all sections
    this.on("click", "[data-action=collapse-all-sections]", () => {
      this.handleCollapseAll();
    });

    // Apply changes
    this.on("click", "[data-action=apply-changes]", () => {
      this.handleApply();
    });

    // Reset all
    this.on("click", "[data-action=reset-all]", () => {
      this.handleResetAll();
    });

    // Show validation
    this.on("click", "[data-action=show-validation]", () => {
      this.handleToggleValidation();
    });
  }

  /**
   * Handle filter input change event.
   * @param {Event} e - The input event object.
   */
  handleFilterChange(e) {
    this.filter = e.target.value.toLowerCase().trim();
    this._updateFilterUI();
  }

  /**
   * Update the filter UI - show/hide categories and update count.
   * @private
   */
  _updateFilterUI() {
    // Update the count display
    const filteredCategories = this.filterCategories(this.filter);
    const totalParams = Object.keys(this._allParameters).length;
    const filteredCount = Object.values(filteredCategories).reduce(
      (sum, cat) => sum + Object.keys(cat.parameters).length,
      0
    );

    const countEl = this.$(".param-count");
    if (countEl) {
      countEl.textContent = `${filteredCount} of ${totalParams} parameters`;
    }

    // Show/hide categories based on filter
    const categoryWrappers = this.$$(".category-wrapper");
    categoryWrappers.forEach((wrapper) => {
      const categoryId = wrapper.dataset.sectionId;
      const category = filteredCategories[categoryId];
      if (category && Object.keys(category.parameters).length > 0) {
        wrapper.style.display = "";
      } else {
        wrapper.style.display = "none";
      }
    });

    // Show/hide no-results message
    const noResults = this.$(".no-results");
    const hasResults = Object.keys(filteredCategories).length > 0;
    if (noResults) {
      noResults.style.display = hasResults ? "none" : "";
    }
  }

  /**
   * Handle section toggle button click.
   * @param {Event} e - The click event object.
   */
  handleSectionToggle(e) {
    const sectionEl = e.target.closest(".parameter-section");
    if (!sectionEl) return;

    const sectionId = sectionEl.dataset.sectionId;
    if (!sectionId) return;

    // Toggle the section
    this.expandedSections[sectionId] = !this.expandedSections[sectionId];
    this._updateSectionUI(sectionId);
  }

  /**
   * Update the section UI for a specific section.
   * @param {string} sectionId - The section/category ID.
   * @private
   */
  _updateSectionUI(sectionId) {
    const sectionEl = this.$(`.parameter-section[data-section-id="${sectionId}"]`);
    if (!sectionEl) return;

    const content = sectionEl.querySelector(".section-content");
    const toggle = sectionEl.querySelector(".section-toggle");
    const isExpanded = this.expandedSections[sectionId];

    if (content) {
      content.style.display = isExpanded ? "" : "none";
    }
    if (toggle) {
      toggle.textContent = isExpanded ? "▼" : "▶";
    }
  }

  /**
   * Handle expand all sections action.
   */
  handleExpandAll() {
    const categoryIds = window.getCategoryIds();
    categoryIds.forEach((catId) => {
      this.expandedSections[catId] = true;
    });
    this._updateAllSectionsUI();
  }

  /**
   * Handle collapse all sections action.
   */
  handleCollapseAll() {
    const categoryIds = window.getCategoryIds();
    categoryIds.forEach((catId) => {
      this.expandedSections[catId] = false;
    });
    this._updateAllSectionsUI();
  }

  /**
   * Update all section UIs after expand/collapse all action.
   * @private
   */
  _updateAllSectionsUI() {
    const categoryIds = window.getCategoryIds();
    categoryIds.forEach((catId) => {
      this._updateSectionUI(catId);
    });
  }

  /**
   * Handle apply changes button click.
   * Validates all parameters and emits change event if valid.
   */
  handleApply() {
    // Final validation before apply
    const validation = window.validateAll(this.config, this._allParameters);
    if (!validation.valid) {
      this.validationResults = validation.errors;
      this.validationSummary = window.createValidationSummary(validation);
      this.showValidationSummary = true;
      this._updateValidationUI();
      showNotification("Please fix validation errors before applying", "warning");
      return;
    }

    // Emit change event
    if (this.props.onChange) {
      this.props.onChange(this.config, {
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

  /**
   * Handle reset all parameters to defaults.
   */
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

    this.config = resetConfig;
    this.validationResults = {};
    this.validationSummary = null;

    // Update all parameter inputs
    this._updateAllInputs();

    if (this.props.onChange) {
      this.props.onChange(resetConfig, {
        changed: [],
        validation: { valid: true, errors: {}, warnings: {} },
      });
    }

    showNotification("All settings reset to defaults", "info");
  }

  /**
   * Update all parameter input elements in the DOM.
   * @private
   */
  _updateAllInputs() {
    // Update all ParameterInput components
    const inputs = this.$$(".parameter-input");
    inputs.forEach((inputEl) => {
      const paramId = inputEl.dataset.paramId;
      if (paramId && this.config[paramId] !== undefined) {
        const input = inputEl.querySelector("input, select");
        if (input) {
          const param = this._allParameters[paramId];
          if (param) {
            const value = this.config[paramId];
            if (param.type === "boolean") {
              input.checked = value === true;
            } else {
              input.value = value === null || value === undefined ? "" : String(value);
            }
          }
        }
      }
    });

    // Update validation summary button
    const validationBtn = this.$("[data-action=show-validation]");
    if (validationBtn && this.validationSummary?.hasErrors) {
      validationBtn.textContent = `Show Errors (${this.validationSummary.errorCount})`;
      validationBtn.style.display = "";
    } else if (validationBtn) {
      validationBtn.style.display = "none";
    }
  }

  /**
   * Handle toggle validation summary visibility.
   */
  handleToggleValidation() {
    this.showValidationSummary = !this.showValidationSummary;
    this._updateValidationBanner();
  }

  /**
   * Update validation UI - banner and button.
   * @private
   */
  _updateValidationUI() {
    // Update validation banner
    this._updateValidationBanner();

    // Update validation button
    const validationBtn = this.$("[data-action=show-validation]");
    if (validationBtn) {
      if (this.validationSummary?.hasErrors) {
        validationBtn.textContent = `Show Errors (${this.validationSummary.errorCount})`;
        validationBtn.style.display = "";
      } else {
        validationBtn.style.display = "none";
      }
    }
  }

  /**
   * Update the validation banner in the DOM.
   * @private
   */
  _updateValidationBanner() {
    const banner = this.$(".validation-banner");
    if (!banner) return;

    if (!this.showValidationSummary || !this.validationSummary) {
      banner.style.display = "none";
      return;
    }

    banner.style.display = "";
    const isValid = this.validationSummary.isValid;
    banner.className = `validation-banner banner-${isValid ? "valid" : "error"}`;

    const icon = banner.querySelector(".banner-icon");
    const text = banner.querySelector(".banner-text");
    const errors = banner.querySelector(".banner-errors");

    if (icon) icon.textContent = isValid ? "✓" : "⚠";
    if (text) {
      if (isValid) {
        text.innerHTML = "<strong>All parameters valid</strong>";
      } else {
        text.innerHTML = `<strong>${this.validationSummary.errorCount} error(s) found</strong>${
          this.validationSummary.warningCount > 0 ? `, ${this.validationSummary.warningCount} warning(s)` : ""}`;
      }
    }
    if (errors) {
      if (!isValid && this.validationSummary.errorFields.length > 0) {
        errors.style.display = "";
        errors.innerHTML = this.validationSummary.errorFields
          .slice(0, 5)
          .map((field) => `<li>${field}</li>`)
          .join("") +
          (this.validationSummary.errorFields.length > 5
            ? `<li>...and ${this.validationSummary.errorFields.length - 5} more</li>`
            : "");
      } else {
        errors.style.display = "none";
      }
    }
  }

  /**
   * Render the complete parameter form.
   * @returns {HTMLElement} The form container element.
   */
  render() {
    // Filter parameters based on search
    const filteredCategories = this.filterCategories(this.filter);

    // Count total parameters
    const totalParams = Object.keys(this._allParameters).length;
    const filteredCount = Object.values(filteredCategories).reduce(
      (sum, cat) => sum + Object.keys(cat.parameters).length,
      0
    );

    return Component.h(
      "div",
      { className: "parameter-form" },
      this.renderToolbar(this.filter, totalParams, filteredCount, this.showValidationSummary),
      this.renderValidationBanner(this.validationSummary, this.showValidationSummary),
      this.renderCategories(filteredCategories)
    );
  }

  /**
   * Render the toolbar with filter, expand/collapse, reset, and apply buttons.
   * @param {string} filter - Current filter text.
   * @param {number} totalParams - Total number of parameters.
   * @param {number} filteredCount - Number of filtered parameters.
   * @param {boolean} showValidationSummary - Whether to show validation summary.
   * @returns {HTMLElement} The toolbar element.
   */
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
        this.validationSummary?.hasErrors
          ? Component.h(
            "button",
            {
              type: "button",
              className: "btn btn-warning btn-sm",
              "data-action": "show-validation",
            },
            `Show Errors (${this.validationSummary.errorCount})`
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

  /**
   * Render the validation banner showing validation summary.
   * @param {Object} validationSummary - The validation summary object.
   * @param {boolean} expanded - Whether the banner is expanded.
   * @returns {HTMLElement|null} The banner element or null.
   */
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

  /**
   * Render all categories with their parameters.
   * @param {Object} filteredCategories - Map of category ID to category info.
   * @returns {HTMLElement} The categories container element.
   */
  renderCategories(filteredCategories) {
    const categoryIds = Object.keys(filteredCategories);

    if (categoryIds.length === 0) {
      return Component.h(
        "div",
        { className: "no-results" },
        Component.h("p", {}, `No parameters matching "${this.filter}"`)
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

  /**
   * Render a single category section.
   * @param {string} categoryId - The category identifier.
   * @param {Object} categoryInfo - The category information object.
   * @returns {HTMLElement} The category wrapper element.
   */
  renderCategory(categoryId, categoryInfo) {
    const expanded = this.expandedSections[categoryId];

    // Get parameters for this category
    const parameters = categoryInfo.parameters;

    // Apply filter to parameters
    const filteredParams = this.filterParameters(parameters, this.filter);

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
        config: this.config,
        defaults: this.defaults,
        inheritance: this.inheritance,
        editableFields: this.editableFields,
        expanded,
        onChange: (field, value) => this.handleParamChange(field, value),
        onValidate: (field, validation) => this.handleParamValidation(field, validation),
      })
    );
  }

  /**
   * Filter categories based on search text.
   * @param {string} filter - The filter text to search for.
   * @returns {Object} Map of matching categories.
   */
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

  /**
   * Filter parameters within a category based on search text.
   * @param {Object} parameters - Map of parameter ID to parameter config.
   * @param {string} filter - The filter text to search for.
   * @returns {Object} Map of matching parameters.
   */
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

  /**
   * Handle parameter value change from child component.
   * @param {string} field - The parameter field ID.
   * @param {*} value - The new value.
   */
  handleParamChange(field, value) {
    this._changedFields.add(field);

    // Update config directly
    this.config[field] = value;

    if (this.props.onChange) {
      this.props.onChange(field, value);
    }
  }

  /**
   * Handle parameter validation result from child component.
   * @param {string} field - The parameter field ID.
   * @param {Object} validation - The validation result object.
   */
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

    this.validationSummary = window.createValidationSummary({
      errors: this._validationErrors,
      warnings: this._validationWarnings,
    });

    this._updateValidationUI();

    if (this.props.onValidate) {
      this.props.onValidate(field, validation);
    }
  }

  // Public API
  /**
   * Set the current configuration.
   * @param {Object} config - The configuration object.
   */
  setConfig(config) {
    this.config = { ...config };
  }

  /**
   * Get the current configuration.
   * @returns {Object} The current configuration object.
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get list of fields that have been changed.
   * @returns {Array} Array of changed field IDs.
   */
  getChangedFields() {
    return Array.from(this._changedFields);
  }

  /**
   * Validate all parameters in the current configuration.
   * @returns {Object} Validation result with valid, errors, and warnings.
   */
  validate() {
    const result = window.validateAll(this.config, this._allParameters);
    this.validationResults = result.errors;
    this.validationSummary = result;
    this._updateValidationUI();
    return result;
  }

  /**
   * Reset all parameters to their default values.
   */
  reset() {
    this._changedFields.clear();
    this._validationErrors = {};
    this._validationWarnings = {};
    this.config = this.props.config || {};
    this.validationResults = {};
    this.validationSummary = null;
    this._updateAllInputs();
  }
}

window.ParameterForm = ParameterForm;
